


import { db } from "./index";
import { businesses, invoices, payments } from "./schema";
import { and, eq, isNull } from "drizzle-orm";
import { getExchangeRate } from "../lib/currency/exchange-rates";

const SCALE = 1_000_000_000_000n;
const MAX_CENTS = 999999999999999999n;

function toScaled(value: string, decimals: number): bigint {
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${decimals}})?$`).test(value)) {
    throw new Error(`Invalid decimal: ${value}`);
  }

  const [whole, fraction = ""] = value.split(".");

  return (
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0"))
  );
}

function toMoney(cents: bigint): string {
  if (cents < 0n || cents > MAX_CENTS) {
    throw new Error("Converted amount exceeds database limits.");
  }

  return `${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`;
}

function convert(amount: string, rate: number) {
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Invalid exchange rate.");
  }

  const rateString = rate.toFixed(12);
  const scaledRate = toScaled(rateString, 12);

  if (scaledRate <= 0n) {
    throw new Error("Exchange rate precision is insufficient.");
  }

  const amountCents = toScaled(amount, 2);
  const convertedCents =
    (amountCents * scaledRate + SCALE / 2n) / SCALE;

  return {
    exchangeRate: rateString,
    convertedAmount: toMoney(convertedCents),
  };
}

function currencyCode(value: string): string {
  const code = value.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(code)) {
    throw new Error(`Invalid currency: ${value}`);
  }

  return code;
}

const rateCache = new Map<
  string,
  Awaited<ReturnType<typeof getExchangeRate>>
>();

async function historicalRate(
  from: string,
  to: string,
  date: string
) {
  const key = `${from}:${to}:${date}`;

  const cached = rateCache.get(key);
  if (cached) return cached;

  const result = await getExchangeRate(from, to, date);
  rateCache.set(key, result);

  return result;
}

async function main() {
  const businessRows = await db
    .select({
      id: businesses.id,
      currency: businesses.currency,
    })
    .from(businesses);

  const businessCurrencies = new Map(
    businessRows.map((business) => [
      business.id,
      business.currency,
    ])
  );

  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(isNull(invoices.exchangeRate));

  const paymentRows = await db
    .select()
    .from(payments)
    .where(isNull(payments.exchangeRate));

  const invoiceCurrencies = new Map(
    (await db
      .select({
        id: invoices.id,
        currency: invoices.currency,
      })
      .from(invoices)
    ).map((invoice) => [invoice.id, invoice.currency])
  );

  const stats = {
    invoicesUpdated: 0,
    invoicesSkipped: 0,
    paymentsUpdated: 0,
    paymentsSkipped: 0,
  };

  console.log(`Invoices to process: ${invoiceRows.length}`);
  console.log(`Payments to process: ${paymentRows.length}`);

  for (const invoice of invoiceRows) {
    try {
      const reportingCurrency = businessCurrencies.get(
        invoice.businessId
      );

      if (!reportingCurrency) {
        throw new Error("Business currency unavailable.");
      }

      const from = currencyCode(invoice.currency);
      const to = currencyCode(reportingCurrency);

      const rate = await historicalRate(
        from,
        to,
        invoice.issueDate
      );

      const converted = convert(invoice.total, rate.rate);

      const updated = await db
        .update(invoices)
        .set({
          reportingCurrency: to,
          exchangeRate: converted.exchangeRate,
          convertedTotal: converted.convertedAmount,
          exchangeRateDate: rate.date,
        })
        .where(
          and(
            eq(invoices.id, invoice.id),
            isNull(invoices.exchangeRate)
          )
        )
        .returning({ id: invoices.id });

      if (updated.length) {
        stats.invoicesUpdated++;
      } else {
        stats.invoicesSkipped++;
      }
    } catch (error) {
      stats.invoicesSkipped++;
      console.error(
        `Skipped invoice ${invoice.number}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  for (const payment of paymentRows) {
    try {
      const reportingCurrency = businessCurrencies.get(
        payment.businessId
      );

      const originalCurrency = invoiceCurrencies.get(
        payment.invoiceId
      );

      if (!reportingCurrency || !originalCurrency) {
        throw new Error(
          "Business or invoice currency unavailable."
        );
      }

      const from = currencyCode(originalCurrency);
      const to = currencyCode(reportingCurrency);

      const rate = await historicalRate(
        from,
        to,
        payment.paymentDate
      );

      const converted = convert(payment.amount, rate.rate);

      const updated = await db
        .update(payments)
        .set({
          currency: from,
          reportingCurrency: to,
          exchangeRate: converted.exchangeRate,
          convertedAmount: converted.convertedAmount,
          exchangeRateDate: rate.date,
        })
        .where(
          and(
            eq(payments.id, payment.id),
            isNull(payments.exchangeRate)
          )
        )
        .returning({ id: payments.id });

      if (updated.length) {
        stats.paymentsUpdated++;
      } else {
        stats.paymentsSkipped++;
      }
    } catch (error) {
      stats.paymentsSkipped++;
      console.error(
        `Skipped payment ${payment.id}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log("\nBackfill complete:");
  console.table(stats);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  });
