
import { getCustomerSession } from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  payments,
  invoices,
  clients,
  businesses,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { CreditCard, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

const RATE_SCALE = 1_000_000_000_000n;

// Convert a stored decimal string into an exact
// integer representation without using floating-point maths.
function decimalToScaled(
  value: string,
  decimals: number
): bigint {
  const pattern = new RegExp(
    `^\\d+(?:\\.\\d{1,${decimals}})?$`
  );

  if (!pattern.test(value)) {
    throw new Error("Invalid stored financial amount.");
  }

  const [whole, fraction = ""] = value.split(".");

  return (
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0"))
  );
}

function amountToCents(value: string): bigint {
  return decimalToScaled(value, 2);
}

function convertPaymentToCents(
  amount: string,
  exchangeRate: string
): bigint {
  const amountCents = amountToCents(amount);
  const scaledRate = decimalToScaled(exchangeRate, 12);

  if (scaledRate <= 0n) {
    throw new Error("Invalid stored exchange rate.");
  }

  // Round to the nearest cent.
  return (
    amountCents * scaledRate + RATE_SCALE / 2n
  ) / RATE_SCALE;
}

function formatCents(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;

  const whole = absolute / 100n;
  const fraction = (absolute % 100n)
    .toString()
    .padStart(2, "0");

  const formattedWhole = whole
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return (
    `${negative ? "-" : ""}` +
    `${formattedWhole}.${fraction}`
  );
}

function normaliseCurrency(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  const code = value.trim().toUpperCase();

  return /^[A-Z]{3}$/.test(code) ? code : null;
}

export default async function PaymentsPage() {
  const session = await getCustomerSession();

  if (!session || !session.businessId) {
    redirect("/sign-in");
  }

  const businessId = session.businessId;

  const [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId));

  if (!biz) {
    throw new Error("Business not found.");
  }

  const currency = normaliseCurrency(biz.currency);

  if (!currency) {
    throw new Error("Invalid business currency.");
  }

  const allPayments = await db
    .select({
      payment: payments,
      invoiceNumber: invoices.number,
      invoiceId: invoices.id,
      invoiceCurrency: invoices.currency,
      clientName: clients.name,
    })
    .from(payments)
    .leftJoin(
      invoices,
      eq(payments.invoiceId, invoices.id)
    )
    .leftJoin(
      clients,
      eq(invoices.clientId, clients.id)
    )
    .where(eq(payments.businessId, businessId))
    .orderBy(desc(payments.createdAt));

  let totalCollectedCents = 0n;
  let totalAvailable = true;

  for (const {
    payment,
    invoiceCurrency,
  } of allPayments) {
    const originalCurrency = normaliseCurrency(
      payment.currency || invoiceCurrency
    );

    const reportingCurrency = normaliseCurrency(
      payment.reportingCurrency
    );

    try {
      const originalAmountCents = amountToCents(
        payment.amount
      );

      // Zero-value payments do not affect totals.
      if (originalAmountCents === 0n) {
        continue;
      }

      if (!originalCurrency) {
        totalAvailable = false;
        continue;
      }

      // No conversion is necessary when the
      // payment and business currencies match.
      if (originalCurrency === currency) {
        totalCollectedCents += originalAmountCents;
        continue;
      }

      // Historical FX metadata must match the
      // current business reporting currency.
      if (
        reportingCurrency !== currency ||
        !payment.exchangeRate ||
        !payment.convertedAmount ||
        !payment.exchangeRateDate
      ) {
        totalAvailable = false;
        continue;
      }

      // Use the exact converted amount recorded
      // when the payment was created.
      const convertedCents = amountToCents(
        payment.convertedAmount
      );

      // Ensure the stored rate itself is valid.
      const storedRate = decimalToScaled(
        payment.exchangeRate,
        12
      );

      if (storedRate <= 0n) {
        totalAvailable = false;
        continue;
      }

      totalCollectedCents += convertedCents;
    } catch {
      // Never silently count malformed financial
      // records as zero.
      totalAvailable = false;
    }
  }

  const totalCollectedDisplay = totalAvailable
    ? `${currency} ${formatCents(totalCollectedCents)}`
    : "Unavailable";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Payment Tracking
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review all payments recorded across your client invoices
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/40">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Total Collected
            </span>
            <span className="text-sm font-extrabold text-white">
              {totalCollectedDisplay}
            </span>
            {!totalAvailable && (
              <span className="text-[10px] text-amber-400 block mt-1">
                Some historical payments lack valid currency conversion data.
              </span>
            )}
          </div>
        </div>
      </div>

      {allPayments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">
            No payments recorded yet
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            When clients pay via bank transfer, PayPal,
            cash or card, record payments directly against
            their invoice.
          </p>
          <Link
            href="/invoices"
            className="mt-6 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md"
          >
            View Invoices
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 bg-slate-900/80 border-b border-slate-800 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="py-3.5 px-4">
                    Date
                  </th>
                  <th className="py-3.5 px-4">
                    Invoice #
                  </th>
                  <th className="py-3.5 px-4">
                    Client
                  </th>
                  <th className="py-3.5 px-4">
                    Method
                  </th>
                  <th className="py-3.5 px-4">
                    Reference
                  </th>
                  <th className="py-3.5 px-4 text-right">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {allPayments.map(
                  ({
                    payment,
                    invoiceNumber,
                    invoiceId,
                    invoiceCurrency,
                    clientName,
                  }) => {
                    const originalCurrency =
                      normaliseCurrency(
                        payment.currency ||
                        invoiceCurrency
                      );

                    return (
                      <tr
                        key={payment.id}
                        className="hover:bg-slate-800/40"
                      >
                        <td className="py-4 px-4 text-slate-400">
                          {payment.paymentDate}
                        </td>

                        <td className="py-4 px-4 font-mono font-bold">
                          {invoiceId ? (
                            <Link
                              href={`/invoices/${invoiceId}`}
                              className="text-emerald-400 hover:underline"
                            >
                              {invoiceNumber || "Unknown"}
                            </Link>
                          ) : (
                            <span className="text-slate-500">
                              Unknown
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 font-medium text-white">
                          {clientName || "Unknown"}
                        </td>

                        <td className="py-4 px-4">
                          {payment.method}
                        </td>

                        <td className="py-4 px-4 font-mono text-slate-400">
                          {payment.reference || "—"}
                        </td>

                        <td className="py-4 px-4 text-right font-mono font-extrabold text-emerald-400">
                          +{originalCurrency || "Unknown"}{" "}
                          {payment.amount}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
