
import { getCustomerSession } from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  invoices,
  payments,
  clients,
  businesses,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { BarChart3, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const RATE_SCALE = 1_000_000_000_000n;

function decimalToScaled(
  value: string,
  decimals: number
): bigint {
  const pattern = new RegExp(
    `^\\d+(?:\\.\\d{1,${decimals}})?$`
  );

  if (!pattern.test(value)) {
    throw new Error("Invalid stored financial decimal.");
  }

  const [whole, fraction = ""] = value.split(".");

  return (
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0"))
  );
}

function toCents(value: string): bigint {
  return decimalToScaled(value, 2);
}

function convertToCents(
  amount: string,
  exchangeRate: string
): bigint {
  const amountCents = toCents(amount);
  const rate = decimalToScaled(exchangeRate, 12);

  if (rate <= 0n) {
    throw new Error("Invalid exchange rate.");
  }

  return (
    amountCents * rate + RATE_SCALE / 2n
  ) / RATE_SCALE;
}

function formatCents(value: bigint): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;

  const whole = (absolute / 100n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const fraction = (absolute % 100n)
    .toString()
    .padStart(2, "0");

  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

function normaliseCurrency(
  value: string | null | undefined
): string | null {
  if (!value) return null;

  const code = value.trim().toUpperCase();

  return /^[A-Z]{3}$/.test(code) ? code : null;
}

type FinancialTotal = {
  cents: bigint;
  available: boolean;
};

function newTotal(): FinancialTotal {
  return {
    cents: 0n,
    available: true,
  };
}

function addInvoiceAmount(
  total: FinancialTotal,
  amount: string,
  invoiceCurrency: string,
  reportingCurrency: string,
  savedReportingCurrency: string | null,
  exchangeRate: string | null
) {
  if (!total.available) return;

  try {
    const amountCents = toCents(amount);

    if (amountCents === 0n) return;

    const original = normaliseCurrency(invoiceCurrency);

    if (!original) {
      total.available = false;
      return;
    }

    if (original === reportingCurrency) {
      total.cents += amountCents;
      return;
    }

    if (
      normaliseCurrency(savedReportingCurrency) !==
        reportingCurrency ||
      !exchangeRate
    ) {
      total.available = false;
      return;
    }

    total.cents += convertToCents(
      amount,
      exchangeRate
    );
  } catch {
    total.available = false;
  }
}

function displayTotal(
  total: FinancialTotal,
  currency: string
): string {
  return total.available
    ? `${currency} ${formatCents(total.cents)}`
    : "Unavailable";
}

type ClientOutstanding = {
  id: string;
  name: string;
  outstanding: FinancialTotal;
  count: number;
};

export default async function AnalyticsPage() {
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

  const allInvoices = await db
    .select({
      invoice: invoices,
      clientName: clients.name,
    })
    .from(invoices)
    .leftJoin(
      clients,
      eq(invoices.clientId, clients.id)
    )
    .where(eq(invoices.businessId, businessId));

  const allPayments = await db
    .select({
      payment: payments,
      invoiceCurrency: invoices.currency,
    })
    .from(payments)
    .leftJoin(
      invoices,
      eq(payments.invoiceId, invoices.id)
    )
    .where(eq(payments.businessId, businessId));

  const totalInvoiced = newTotal();
  const totalCollected = newTotal();
  const totalOutstanding = newTotal();
  const totalOverdue = newTotal();

  const clientOutstanding = new Map<
    string,
    ClientOutstanding
  >();

  const statusCounts: Record<string, number> = {
    DRAFT: 0,
    SENT: 0,
    VIEWED: 0,
    PAID: 0,
    OVERDUE: 0,
  };

  const today = new Date()
    .toISOString()
    .slice(0, 10);

  // INVOICES
  // Invoice issue-date exchange rates are used
  // for invoiced, outstanding and overdue values.
  for (const { invoice, clientName } of allInvoices) {
    addInvoiceAmount(
      totalInvoiced,
      invoice.total,
      invoice.currency,
      currency,
      invoice.reportingCurrency,
      invoice.exchangeRate
    );

    addInvoiceAmount(
      totalOutstanding,
      invoice.balanceDue,
      invoice.currency,
      currency,
      invoice.reportingCurrency,
      invoice.exchangeRate
    );

    const isOverdue =
      invoice.status === "OVERDUE" ||
      (
        invoice.status !== "PAID" &&
        invoice.dueDate < today
      );

    if (isOverdue) {
      addInvoiceAmount(
        totalOverdue,
        invoice.balanceDue,
        invoice.currency,
        currency,
        invoice.reportingCurrency,
        invoice.exchangeRate
      );
    }

    statusCounts[invoice.status] =
      (statusCounts[invoice.status] || 0) + 1;

    // Group by client ID rather than client name.
    // Different clients may share the same name.
    const clientId = invoice.clientId;

    let client = clientOutstanding.get(clientId);

    if (!client) {
      client = {
        id: clientId,
        name: clientName || "Unknown",
        outstanding: newTotal(),
        count: 0,
      };

      clientOutstanding.set(clientId, client);
    }

    addInvoiceAmount(
      client.outstanding,
      invoice.balanceDue,
      invoice.currency,
      currency,
      invoice.reportingCurrency,
      invoice.exchangeRate
    );

    client.count++;
  }

  // PAYMENTS
  // Use the saved converted payment amounts.
  // These use the payment date, not invoice issue date.
  for (const {
    payment,
    invoiceCurrency,
  } of allPayments) {
    try {
      const originalCurrency = normaliseCurrency(
        payment.currency || invoiceCurrency
      );

      const amountCents = toCents(payment.amount);

      if (amountCents === 0n) continue;

      if (!originalCurrency) {
        totalCollected.available = false;
        continue;
      }

      if (originalCurrency === currency) {
        totalCollected.cents += amountCents;
        continue;
      }

      if (
        normaliseCurrency(payment.reportingCurrency) !==
          currency ||
        !payment.exchangeRate ||
        !payment.convertedAmount ||
        !payment.exchangeRateDate
      ) {
        totalCollected.available = false;
        continue;
      }

      const rate = decimalToScaled(
        payment.exchangeRate,
        12
      );

      if (rate <= 0n) {
        totalCollected.available = false;
        continue;
      }

      totalCollected.cents += toCents(
        payment.convertedAmount
      );
    } catch {
      totalCollected.available = false;
    }
  }

  const clientRows = Array.from(
    clientOutstanding.values()
  );

  const hasUnavailableTotals =
    !totalInvoiced.available ||
    !totalCollected.available ||
    !totalOutstanding.available ||
    !totalOverdue.available ||
    clientRows.some(
      (client) => !client.outstanding.available
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">
          Analytics & Reports
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time revenue metrics and outstanding
          client balances
        </p>
      </div>

      {hasUnavailableTotals && (
        <div className="border border-amber-800/50 bg-amber-950/20 rounded-xl p-4">
          <p className="text-xs text-amber-400">
            Some financial totals are unavailable because
            historical currency conversion information
            is missing or invalid.
          </p>
        </div>
      )}

      {/* Main KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 block">
            Total Invoiced
          </span>
          <span className="text-2xl font-extrabold text-white mt-2 block">
            {displayTotal(totalInvoiced, currency)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {allInvoices.length} invoices generated
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 block">
            Total Collected
          </span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-2 block">
            {displayTotal(totalCollected, currency)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {allPayments.length} payment records
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 block">
            Outstanding
          </span>
          <span className="text-2xl font-extrabold text-amber-400 mt-2 block">
            {displayTotal(totalOutstanding, currency)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Awaiting collection
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 block">
            Overdue
          </span>
          <span className="text-2xl font-extrabold text-rose-400 mt-2 block">
            {displayTotal(totalOverdue, currency)}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Requires follow-up
          </span>
        </div>
      </div>

      {/* Status Breakdown and Client Outstanding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Invoice Status Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>Invoice Status Distribution</span>
          </h2>

          <div className="space-y-3">
            {Object.entries(statusCounts).map(
              ([st, count]) => {
                const pct = allInvoices.length
                  ? Math.round(
                      (count / allInvoices.length) * 100
                    )
                  : 0;

                return (
                  <div key={st} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-300">
                        {st}
                      </span>
                      <span className="text-slate-400">
                        {count} ({pct}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className={`h-full ${
                          st === "PAID"
                            ? "bg-emerald-500"
                            : st === "OVERDUE"
                            ? "bg-rose-500"
                            : st === "VIEWED"
                            ? "bg-cyan-500"
                            : st === "SENT"
                            ? "bg-blue-500"
                            : "bg-slate-600"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Client Outstanding Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Outstanding Balances by Client</span>
          </h2>

          <div className="space-y-3">
            {clientRows.length === 0 ? (
              <p className="text-xs text-slate-500">
                No client records available.
              </p>
            ) : (
              clientRows.map((client) => (
                <div
                  key={client.id}
                  className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">
                      {client.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {client.count} invoices
                    </span>
                  </div>

                  <span
                    className={`font-mono font-extrabold ${
                      client.outstanding.available &&
                      client.outstanding.cents > 0n
                        ? "text-amber-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {displayTotal(
                      client.outstanding,
                      currency
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
