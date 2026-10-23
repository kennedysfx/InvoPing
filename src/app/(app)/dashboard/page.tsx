
import { getCustomerSession } from "@/lib/auth/customer-auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  invoices,
  payments,
  clients,
  businesses,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  FileText,
  UserPlus,
  CreditCard,
  ArrowUpRight,
  MessageSquare,
} from "lucide-react";
import {
  buildWhatsAppClickToChatUrl,
  DEFAULT_REMINDER_TEMPLATES,
  interpolateTemplate,
} from "@/lib/whatsapp/message";

export const dynamic = "force-dynamic";

const SCALE = 1_000_000_000_000n;

function decimalToScaled(
  value: string,
  decimals: number
): bigint {
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${decimals}})?$`).test(value)) {
    throw new Error("Invalid stored decimal.");
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

function convertCents(
  amount: string,
  rate: string
): bigint {
  const cents = toCents(amount);
  const scaledRate = decimalToScaled(rate, 12);
  return (cents * scaledRate + SCALE / 2n) / SCALE;
}

function formatCents(cents: bigint): string {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  const whole = abs / 100n;
  const fraction = (abs % 100n).toString().padStart(2, "0");

  return `${negative ? "-" : ""}${whole.toLocaleString("en-US")}.${fraction}`;
}

type FinancialTotal = {
  cents: bigint;
  available: boolean;
};

function addAmount(
  total: FinancialTotal,
  amount: string,
  originalCurrency: string,
  reportingCurrency: string,
  rate: string | null
) {
  if (!total.available) return;

  if (toCents(amount) === 0n) return;

  if (originalCurrency.toUpperCase() === reportingCurrency.toUpperCase()) {
    total.cents += toCents(amount);
    return;
  }

  if (!rate) {
    total.available = false;
    return;
  }

  total.cents += convertCents(amount, rate);
}

function displayTotal(
  total: FinancialTotal,
  currency: string
): string {
  return total.available
    ? `${currency} ${formatCents(total.cents)}`
    : "Unavailable";
}

export default async function DashboardPage() {
  const session = await getCustomerSession();

  if (!session || !session.businessId) {
    redirect("/sign-in");
  }

  const businessId = session.businessId;

  const [biz] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId));

  const currency = (biz?.currency || "USD").toUpperCase();

  const allInvoices = await db
    .select({
      invoice: invoices,
      clientName: clients.name,
      clientPhone: clients.phone,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.businessId, businessId))
    .orderBy(desc(invoices.createdAt));

  const allPayments = await db
    .select({
      payment: payments,
      invoiceNumber: invoices.number,
      invoiceCurrency: invoices.currency,
      clientName: clients.name,
    })
    .from(payments)
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(payments.businessId, businessId))
    .orderBy(desc(payments.createdAt));

  const totalInvoiced: FinancialTotal = {
    cents: 0n,
    available: true,
  };
  const totalCollected: FinancialTotal = {
    cents: 0n,
    available: true,
  };
  const totalOutstanding: FinancialTotal = {
    cents: 0n,
    available: true,
  };
  const totalOverdue: FinancialTotal = {
    cents: 0n,
    available: true,
  };

  const today = new Date().toISOString().slice(0, 10);

  for (const { invoice } of allInvoices) {
    const invoiceCurrency = invoice.currency.toUpperCase();

    // Saved rates belong to a specific reporting currency.
    const validRate =
      invoice.reportingCurrency?.toUpperCase() === currency
        ? invoice.exchangeRate
        : null;

    addAmount(
      totalInvoiced,
      invoice.total,
      invoiceCurrency,
      currency,
      validRate
    );

    addAmount(
      totalOutstanding,
      invoice.balanceDue,
      invoiceCurrency,
      currency,
      validRate
    );

    const isOverdue =
      invoice.status === "OVERDUE" ||
      (
        invoice.status !== "PAID" &&
        invoice.dueDate < today
      );

    if (isOverdue) {
      addAmount(
        totalOverdue,
        invoice.balanceDue,
        invoiceCurrency,
        currency,
        validRate
      );
    }
  }

  for (const { payment, invoiceCurrency } of allPayments) {
    const originalCurrency = (
      payment.currency ||
      invoiceCurrency ||
      ""
    ).toUpperCase();

    // Only reuse saved rates when their reporting
    // currency matches the current business currency.
    const validRate =
      payment.reportingCurrency?.toUpperCase() === currency
        ? payment.exchangeRate
        : null;

    if (!originalCurrency) {
      if (toCents(payment.amount) > 0n) {
        totalCollected.available = false;
      }
      continue;
    }

    addAmount(
      totalCollected,
      payment.amount,
      originalCurrency,
      currency,
      validRate
    );
  }

  const recentPayments = allPayments.slice(0, 5);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of your invoices and client payments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/clients/new"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Add Client</span>
          </Link>
          <Link
            href="/invoices/new"
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Total Invoiced
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white mt-3">
            {displayTotal(totalInvoiced, currency)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {allInvoices.length} total invoices created
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Total Collected
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-400 mt-3">
            {displayTotal(totalCollected, currency)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Recorded client payments
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Outstanding Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center border border-amber-800/40">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-400 mt-3">
            {displayTotal(totalOutstanding, currency)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Pending client payments
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              Overdue Amount
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-950 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-400 mt-3">
            {displayTotal(totalOverdue, currency)}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Due date has passed
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Invoices */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>Recent Invoices</span>
            </h2>
            <Link
              href="/invoices"
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {allInvoices.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">
                No invoices created yet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Create your first invoice and share it instantly via WhatsApp.
              </p>
              <Link
                href="/invoices/new"
                className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Create Invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-2">Invoice #</th>
                    <th className="pb-3 px-2">Client</th>
                    <th className="pb-3 px-2">Due Date</th>
                    <th className="pb-3 px-2">Total</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {allInvoices.slice(0, 6).map(
                    ({ invoice, clientName, clientPhone }) => {
                      const waMessage = interpolateTemplate(
                        DEFAULT_REMINDER_TEMPLATES.invoice_share.template,
                        {
                          clientName: clientName || "Client",
                          businessName: biz?.name || "Business",
                          invoiceNumber: invoice.number,
                          currency: invoice.currency,
                          total: invoice.total,
                          balance: invoice.balanceDue,
                          dueDate: invoice.dueDate,
                          publicUrl: `${appUrl}/i/${invoice.publicToken}`,
                        }
                      );

                      const waUrl = buildWhatsAppClickToChatUrl(
                        clientPhone || "",
                        waMessage
                      );

                      return (
                        <tr
                          key={invoice.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-2 font-mono font-bold text-white">
                            {invoice.number}
                          </td>
                          <td className="py-3.5 px-2 font-medium">
                            {clientName || "Unknown"}
                          </td>
                          <td className="py-3.5 px-2 text-slate-400">
                            {invoice.dueDate}
                          </td>
                          <td className="py-3.5 px-2 font-semibold text-white">
                            {invoice.currency} {invoice.total}
                          </td>
                          <td className="py-3.5 px-2">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                invoice.status === "PAID"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                                  : invoice.status === "OVERDUE"
                                  ? "bg-rose-950 text-rose-400 border border-rose-800/50"
                                  : invoice.status === "VIEWED"
                                  ? "bg-cyan-950 text-cyan-400 border border-cyan-800/50"
                                  : invoice.status === "SENT"
                                  ? "bg-blue-950 text-blue-400 border border-blue-800/50"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {invoice.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {clientPhone && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900 transition-colors"
                                  title="Send on WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <Link
                                href={`/invoices/${invoice.id}`}
                                className="text-xs text-slate-300 hover:text-white px-2 py-1 bg-slate-800 rounded-md border border-slate-700"
                              >
                                View
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>Recent Payments</span>
            </h2>
            <Link
              href="/payments"
              className="text-xs text-emerald-400 hover:underline"
            >
              View All
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No payments recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {recentPayments.map(
                ({
                  payment,
                  invoiceNumber,
                  invoiceCurrency,
                  clientName,
                }) => (
                  <div
                    key={payment.id}
                    className="bg-slate-800/40 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">
                        {clientName || "Unknown"}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {invoiceNumber} • {payment.method}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-400 block">
                        +{payment.currency || invoiceCurrency || "Unknown"}{" "}
                        {payment.amount}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {payment.paymentDate}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
