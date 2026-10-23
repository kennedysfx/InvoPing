
"use server";

import { getCustomerSession } from "@/lib/auth/customer-auth";
import { getExchangeRate } from "@/lib/currency/exchange-rates";
import { db } from "@/db";
import { businesses, invoices } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface PaymentRecordPayload {
  invoiceId: string;
  amount: number | string;
  paymentDate: string;
  method: string;
  reference?: string;
  notes?: string;
}

const PAYMENT_METHODS = [
  "Bank Transfer",
  "Cash",
  "PayPal",
  "Card",
  "Other",
] as const;

const RATE_SCALE = 1_000_000_000_000n;

function parsePaymentAmount(
  value: number | string
): string | null {
  const input = String(value).trim();

  if (!/^\d{1,10}(\.\d{1,2})?$/.test(input)) {
    return null;
  }

  const [whole, fraction = ""] = input.split(".");

  const cents =
    BigInt(whole) * 100n +
    BigInt(fraction.padEnd(2, "0"));

  if (cents <= 0n || cents > 999999999999n) {
    return null;
  }

  return (
    `${cents / 100n}.` +
    `${(cents % 100n).toString().padStart(2, "0")}`
  );
}

function isValidPaymentDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function decimalToCents(value: string): bigint {
  const [whole, fraction = ""] = value.split(".");

  return (
    BigInt(whole) * 100n +
    BigInt(fraction.padEnd(2, "0"))
  );
}

function centsToDecimal(value: bigint): string {
  return (
    `${value / 100n}.` +
    `${(value % 100n).toString().padStart(2, "0")}`
  );
}

function calculateConvertedPayment(
  amount: string,
  rate: number
): {
  exchangeRate: string;
  convertedAmount: string;
} {
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Invalid exchange rate.");
  }

  // Store rates with 12 decimal places.
  const exchangeRate = rate.toFixed(12);

  const [whole, fraction = ""] =
    exchangeRate.split(".");

  const scaledRate =
    BigInt(whole) * RATE_SCALE +
    BigInt(fraction.padEnd(12, "0"));

  if (scaledRate <= 0n) {
    throw new Error(
      "Exchange rate is too small for the configured precision."
    );
  }

  const originalCents = decimalToCents(amount);

  // Integer arithmetic prevents floating-point rounding
  // errors in the stored converted payment.
  const convertedCents =
    (originalCents * scaledRate + RATE_SCALE / 2n) /
    RATE_SCALE;

  // Matches NUMERIC(18,2).
  if (convertedCents > 999999999999999999n) {
    throw new Error(
      "Converted payment exceeds the allowed amount."
    );
  }

  return {
    exchangeRate,
    convertedAmount: centsToDecimal(convertedCents),
  };
}

export async function recordPaymentAction(
  data: PaymentRecordPayload
) {
  const session = await getCustomerSession();

  if (!session || !session.businessId) {
    return {
      success: false,
      error: "Unauthorized.",
    };
  }

  const amount = parsePaymentAmount(data.amount);

  if (!amount) {
    return {
      success: false,
      error:
        "Enter a valid payment amount greater than zero, " +
        "with no more than two decimal places.",
    };
  }

  if (!isValidPaymentDate(data.paymentDate)) {
    return {
      success: false,
      error: "Enter a valid payment date.",
    };
  }

  const today = new Date().toISOString().slice(0, 10);

  if (data.paymentDate > today) {
    return {
      success: false,
      error: "Payment date cannot be in the future.",
    };
  }

  const method = data.method || "Bank Transfer";

  if (!PAYMENT_METHODS.some((allowed) => allowed === method)) {
    return {
      success: false,
      error: "Invalid payment method.",
    };
  }

  const reference = data.reference?.trim() || null;
  const notes = data.notes?.trim() || null;

  try {
    // Retrieve the invoice currency and the business's
    // reporting currency.
    const [invoiceInfo] = await db
      .select({
        invoiceCurrency: invoices.currency,
        reportingCurrency: businesses.currency,
      })
      .from(invoices)
      .innerJoin(
        businesses,
        eq(invoices.businessId, businesses.id)
      )
      .where(
        and(
          eq(invoices.id, data.invoiceId),
          eq(invoices.businessId, session.businessId)
        )
      )
      .limit(1);

    if (!invoiceInfo) {
      return {
        success: false,
        error: "Invoice not found.",
      };
    }

    const originalCurrency =
      invoiceInfo.invoiceCurrency.toUpperCase();

    const reportingCurrency =
      invoiceInfo.reportingCurrency.toUpperCase();

    // Retrieve the exchange rate for the entered payment date.
    // The service returns rate 1 for matching currencies.
    let rateResult;

    try {
      rateResult = await getExchangeRate(
        originalCurrency,
        reportingCurrency,
        data.paymentDate
      );
    } catch (error) {
      console.error("Exchange-rate lookup failed:", error);

      return {
        success: false,
        error:
          "Unable to retrieve the exchange rate for this " +
          "payment. No payment was recorded. Please try again.",
      };
    }

    const {
      exchangeRate,
      convertedAmount,
    } = calculateConvertedPayment(
      amount,
      rateResult.rate
    );

    const exchangeRateDate = rateResult.date;

    /*
     * Financial integrity:
     *
     * 1. Update the invoice only when sufficient balance exists.
     * 2. Insert the original payment and its conversion data.
     * 3. Insert the activity log.
     *
     * All operations run in one PostgreSQL statement.
     *
     * Concurrent payments remain protected by the conditional
     * UPDATE.
     *
     * The business reporting currency is checked again to
     * prevent saving a conversion against a changed currency.
     */

    const result = await db.execute(sql`
      WITH updated_invoice AS (
        UPDATE invoices
        SET
          amount_paid =
            amount_paid + ${amount}::numeric,

          balance_due =
            total - (amount_paid + ${amount}::numeric),

          status = CASE
            WHEN total - (amount_paid + ${amount}::numeric) = 0
              THEN 'PAID'

            WHEN status = 'DRAFT'
              THEN 'DRAFT'

            WHEN due_date < CURRENT_DATE::text
              THEN 'OVERDUE'

            ELSE status
          END,

          updated_at = NOW()

        WHERE id = ${data.invoiceId}
          AND business_id = ${session.businessId}
          AND currency = ${originalCurrency}
          AND balance_due >= ${amount}::numeric
          AND balance_due > 0
          AND amount_paid >= 0
          AND total >= amount_paid
          AND balance_due = total - amount_paid

          AND EXISTS (
            SELECT 1
            FROM businesses
            WHERE businesses.id = invoices.business_id
              AND businesses.currency = ${reportingCurrency}
          )

        RETURNING
          id,
          business_id,
          number,
          currency,
          amount_paid,
          balance_due,
          status
      ),

      inserted_payment AS (
        INSERT INTO payments (
          invoice_id,
          business_id,
          amount,
          currency,
          reporting_currency,
          exchange_rate,
          converted_amount,
          exchange_rate_date,
          payment_date,
          method,
          reference,
          notes
        )

        SELECT
          id,
          business_id,
          ${amount}::numeric,
          currency,
          ${reportingCurrency},
          ${exchangeRate}::numeric,
          ${convertedAmount}::numeric,
          ${exchangeRateDate},
          ${data.paymentDate},
          ${method},
          ${reference},
          ${notes}

        FROM updated_invoice

        RETURNING id, invoice_id
      ),

      inserted_log AS (
        INSERT INTO activity_logs (
          business_id,
          user_id,
          action,
          details
        )

        SELECT
          updated_invoice.business_id,
          ${session.userId},
          'RECORDED_PAYMENT',
          'Recorded payment of '
            || updated_invoice.currency
            || ' '
            || ${amount}
            || ' for '
            || updated_invoice.number
            || ' ('
            || ${reportingCurrency}
            || ' '
            || ${convertedAmount}
            || ' at rate '
            || ${exchangeRate}
            || ')'

        FROM updated_invoice

        INNER JOIN inserted_payment
          ON inserted_payment.invoice_id =
             updated_invoice.id

        RETURNING id
      )

      SELECT
        updated_invoice.id,
        updated_invoice.amount_paid,
        updated_invoice.balance_due,
        updated_invoice.status,
        inserted_payment.id AS payment_id,
        inserted_log.id AS activity_log_id

      FROM updated_invoice

      INNER JOIN inserted_payment
        ON inserted_payment.invoice_id =
           updated_invoice.id

      INNER JOIN inserted_log
        ON TRUE
    `);

    if (result.rows.length === 0) {
      return {
        success: false,
        error:
          "Payment could not be recorded. The invoice may " +
          "already be paid, the payment may exceed the balance, " +
          "or the business currency may have changed. " +
          "Refresh the invoice and try again.",
      };
    }

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${data.invoiceId}`);
    revalidatePath("/payments");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to record payment:", error);

    return {
      success: false,
      error:
        "Payment could not be recorded. Please refresh the " +
        "invoice and check its payment history before trying again.",
    };
  }
}
