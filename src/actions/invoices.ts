
"use server";

import { getCustomerSession } from "@/lib/auth/customer-auth";
import { db } from "@/db";
import {
  invoices,
  businesses,
  clients,
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import {
  calculateInvoiceTotals,
  computeInvoiceStatus,
} from "@/lib/invoices/calculations";
import {
  generateNextInvoiceNumber,
  generatePublicInvoiceToken,
} from "@/lib/invoices/numbering";
import { assertCanCreateInvoice } from "@/lib/subscriptions/limits";
import { getExchangeRate } from "@/lib/currency/exchange-rates";
import { revalidatePath } from "next/cache";

export interface LineItemPayload {
  description: string;
  quantity: number | string;
  unitPrice: number | string;
}

export interface InvoicePayload {
  clientId: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  taxRate?: number | string;
  discountRate?: number | string;
  notes?: string;
  paymentInstructions?: string;
  items: LineItemPayload[];
}

function exactDecimal(
  value: number | string | undefined,
  label: string,
  allowZero: boolean,
  max: number,
  maxDecimals = 2
): string {
  if (
    typeof value !== "string" &&
    (typeof value !== "number" || !Number.isFinite(value))
  ) {
    throw new Error(`${label} must be a valid number.`);
  }

  const raw = String(value).trim();

  if (!/^\d+(?:\.\d+)?$/.test(raw)) {
    throw new Error(
      `${label} must be a valid non-negative number.`
    );
  }

  const [whole, fractional = ""] = raw.split(".");

  if (fractional.length > maxDecimals) {
    throw new Error(
      `${label} must have no more than ${maxDecimals} decimal places.`
    );
  }

  const scaled =
    BigInt(whole) * 100n +
    BigInt(fractional.padEnd(2, "0"));

  if (
    (!allowZero && scaled === 0n) ||
    scaled > BigInt(max) * 100n
  ) {
    throw new Error(
      `${label} must be ${
        allowZero
          ? "between 0 and"
          : "greater than 0 and no more than"
      } ${max}.`
    );
  }

  return `${scaled / 100n}.${String(scaled % 100n).padStart(2, "0")}`;
}

function validateDate(value: string, label: string) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    throw new Error(`${label} must be a valid date.`);
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`${label} must be a valid date.`);
  }
}

function validateInvoice(
  data: InvoicePayload,
  paid = "0.00"
) {
  if (
    !data ||
    typeof data.clientId !== "string" ||
    !data.clientId.trim()
  ) {
    throw new Error("Please select a client.");
  }

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("Please add at least one line item.");
  }

  validateDate(data.issueDate, "Issue date");
  validateDate(data.dueDate, "Due date");

  if (data.dueDate < data.issueDate) {
    throw new Error(
      "Due date cannot be earlier than issue date."
    );
  }

  const taxRate = exactDecimal(
    data.taxRate ?? 0,
    "Tax rate",
    true,
    100
  );

  const discountRate = exactDecimal(
    data.discountRate ?? 0,
    "Discount rate",
    true,
    100
  );

  const formattedItems = data.items.map((item, index) => {
    if (
      !item ||
      typeof item.description !== "string" ||
      !item.description.trim()
    ) {
      throw new Error(
        `Item ${index + 1} needs a description.`
      );
    }

    const quantity = exactDecimal(
      item.quantity,
      `Item ${index + 1} quantity`,
      false,
      9999999999
    );

    const unitPrice = exactDecimal(
      item.unitPrice,
      `Item ${index + 1} price`,
      false,
      9999999999
    );

    const lineTotals = calculateInvoiceTotals(
      [{ quantity, unitPrice }],
      0,
      0,
      0
    );

    if (lineTotals.total === "0.00") {
      throw new Error(
        `Item ${index + 1} amount must be greater than zero.`
      );
    }

    return {
      description: item.description.trim(),
      quantity,
      unitPrice,
      amount: lineTotals.total,
      sortOrder: index,
    };
  });

  const totals = calculateInvoiceTotals(
    formattedItems,
    taxRate,
    discountRate,
    paid
  );

  if (
    totals.total === "0.00" &&
    !(
      discountRate === "100.00" &&
      totals.subtotal !== "0.00"
    )
  ) {
    throw new Error(
      "Invoice total must be greater than zero unless fully discounted."
    );
  }

  return {
    formattedItems,
    totals,
    taxRate,
    discountRate,
  };
}

const RATE_SCALE = 1_000_000_000_000n;

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

function calculateConvertedTotal(
  total: string,
  rate: number
): {
  exchangeRate: string;
  convertedTotal: string;
} {
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Invalid exchange rate.");
  }

  const exchangeRate = rate.toFixed(12);
  const [whole, fraction = ""] = exchangeRate.split(".");

  const scaledRate =
    BigInt(whole) * RATE_SCALE +
    BigInt(fraction.padEnd(12, "0"));

  if (scaledRate <= 0n) {
    throw new Error(
      "Exchange rate is too small for the configured precision."
    );
  }

  const originalCents = decimalToCents(total);

  const convertedCents =
    (originalCents * scaledRate + RATE_SCALE / 2n) /
    RATE_SCALE;

  if (convertedCents > 999999999999999999n) {
    throw new Error(
      "Converted invoice total exceeds the allowed amount."
    );
  }

  return {
    exchangeRate,
    convertedTotal: centsToDecimal(convertedCents),
  };
}

async function prepareInvoiceConversion(
  originalCurrency: string,
  reportingCurrency: string,
  issueDate: string,
  total: string
) {
  const base = originalCurrency.trim().toUpperCase();
  const quote = reportingCurrency.trim().toUpperCase();

  if (
    !/^[A-Z]{3}$/.test(base) ||
    !/^[A-Z]{3}$/.test(quote)
  ) {
    throw new Error(
      "Invalid invoice or business currency."
    );
  }

  let rateResult;

  try {
    rateResult = await getExchangeRate(
      base,
      quote,
      issueDate
    );
  } catch {
    throw new Error(
      "Unable to retrieve the historical exchange rate. " +
      "No invoice changes were saved. Please try again."
    );
  }

  const converted = calculateConvertedTotal(
    total,
    rateResult.rate
  );

  return {
    reportingCurrency: quote,
    exchangeRate: converted.exchangeRate,
    convertedTotal: converted.convertedTotal,
    exchangeRateDate: rateResult.date,
  };
}

function revalidateInvoicePages(invoiceId?: string) {
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");

  if (invoiceId) {
    revalidatePath(`/invoices/${invoiceId}`);
  }
}

export async function createInvoiceAction(
  data: InvoicePayload
) {
  const session = await getCustomerSession();

  if (!session || !session.businessId) {
    return {
      success: false,
      error: "Unauthorized.",
    };
  }

  const businessId = session.businessId;

  try {
    const validated = validateInvoice(data);

    await assertCanCreateInvoice(businessId);

    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(
        and(
          eq(clients.id, data.clientId),
          eq(clients.businessId, businessId)
        )
      );

    if (!client) {
      return {
        success: false,
        error: "Client not found or unauthorized.",
      };
    }

    const [biz] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId));

    if (!biz) {
      return {
        success: false,
        error: "Business not found.",
      };
    }

    const originalCurrency = (
      data.currency || biz.currency
    )
      .trim()
      .toUpperCase();

    const conversion = await prepareInvoiceConversion(
      originalCurrency,
      biz.currency,
      data.issueDate,
      validated.totals.total
    );

    const number = await generateNextInvoiceNumber(
      businessId
    );

    const publicToken = generatePublicInvoiceToken();

    const {
      formattedItems,
      totals,
      taxRate,
      discountRate,
    } = validated;

    const initialStatus = computeInvoiceStatus(
      "DRAFT",
      data.dueDate,
      totals.balanceDue
    );

    const itemsJson = JSON.stringify(formattedItems);

    /*
     * Neon HTTP-compatible atomic invoice creation.
     *
     * One PostgreSQL statement performs:
     * - invoice insertion
     * - line-item insertion
     * - activity-log insertion
     *
     * PostgreSQL executes the statement atomically.
     * No db.transaction() callback is required.
     */

    const result = await db.execute(sql`
      WITH created_invoice AS (
        INSERT INTO invoices (
          business_id,
          client_id,
          number,
          issue_date,
          due_date,
          currency,
          reporting_currency,
          exchange_rate,
          converted_total,
          exchange_rate_date,
          subtotal,
          tax_rate,
          tax_amount,
          discount_rate,
          discount_amount,
          total,
          amount_paid,
          balance_due,
          status,
          public_token,
          notes,
          payment_instructions
        )
        SELECT
          ${businessId},
          ${data.clientId},
          ${number},
          ${data.issueDate},
          ${data.dueDate},
          ${originalCurrency},
          ${conversion.reportingCurrency},
          ${conversion.exchangeRate}::numeric,
          ${conversion.convertedTotal}::numeric,
          ${conversion.exchangeRateDate},
          ${totals.subtotal}::numeric,
          ${taxRate}::numeric,
          ${totals.taxAmount}::numeric,
          ${discountRate}::numeric,
          ${totals.discountAmount}::numeric,
          ${totals.total}::numeric,
          0::numeric,
          ${totals.balanceDue}::numeric,
          ${initialStatus},
          ${publicToken},
          ${data.notes?.trim() || null},
          ${
            data.paymentInstructions?.trim() ||
            biz.paymentInstructions ||
            null
          }
        WHERE EXISTS (
          SELECT 1
          FROM businesses
          WHERE id = ${businessId}
            AND currency = ${biz.currency}
        )
        RETURNING id, number
      ),

      created_items AS (
        INSERT INTO invoice_items (
          invoice_id,
          description,
          quantity,
          unit_price,
          amount,
          sort_order
        )
        SELECT
          created_invoice.id,
          item.description,
          item.quantity,
          item."unitPrice",
          item.amount,
          item."sortOrder"
        FROM created_invoice
            CROSS JOIN LATERAL jsonb_to_recordset(
          ${itemsJson}::jsonb
        ) AS item(
          description text,
          quantity numeric,
          "unitPrice" numeric,
          amount numeric,
          "sortOrder" integer
        )
        RETURNING id
      ),

      created_log AS (
        INSERT INTO activity_logs (
          business_id,
          user_id,
          action,
          details
        )
        SELECT
          ${businessId},
          ${session.userId},
          'CREATED_INVOICE',
          'Created invoice ' || created_invoice.number
        FROM created_invoice
        CROSS JOIN (
          SELECT COUNT(*) AS item_count
          FROM created_items
        ) AS item_check
        WHERE item_check.item_count =
          ${formattedItems.length}
        RETURNING id
      )

      SELECT
        created_invoice.id,
        (SELECT COUNT(*) FROM created_items)
          AS item_count,
        (SELECT COUNT(*) FROM created_log)
          AS log_count
      FROM created_invoice
    `);

    const created = result.rows[0];

    if (!created) {
      return {
        success: false,
        error:
          "Invoice could not be created. " +
          "Please refresh and try again.",
      };
    }

    if (
      Number(created.item_count) !==
        formattedItems.length ||
      Number(created.log_count) !== 1
    ) {
      throw new Error(
        "Invoice creation was incomplete. " +
        "Please check the invoice list before retrying."
      );
    }

    revalidateInvoicePages();

    return {
      success: true,
      invoiceId: String(created.id),
    };
  } catch (err) {
    console.error("Invoice creation failed:", err);

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Unable to create invoice.",
    };
  }
}

export async function updateInvoiceAction(
  invoiceId: string,
  data: InvoicePayload
) {
  const session = await getCustomerSession();

  if (!session || !session.businessId) {
    return {
      success: false,
      error: "Unauthorized.",
    };
  }

  const businessId = session.businessId;

  try {
    const [inv] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.businessId, businessId)
        )
      );

    if (!inv) {
      return {
        success: false,
        error: "Invoice not found or unauthorized.",
      };
    }

    const validated = validateInvoice(
      data,
      inv.amountPaid
    );

    const [client] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(
        and(
          eq(clients.id, data.clientId),
          eq(clients.businessId, businessId)
        )
      );

    if (!client) {
      return {
        success: false,
        error: "Client not found or unauthorized.",
      };
    }

    const [biz] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId));

    if (!biz) {
      return {
        success: false,
        error: "Business not found.",
      };
    }

    const originalCurrency = (
      data.currency || inv.currency
    )
      .trim()
      .toUpperCase();

    if (
      decimalToCents(inv.amountPaid) > 0n &&
      originalCurrency !== inv.currency.toUpperCase()
    ) {
      return {
        success: false,
        error:
          "Invoice currency cannot be changed after " +
          "payments have been recorded.",
      };
    }

    const conversion = await prepareInvoiceConversion(
      originalCurrency,
      biz.currency,
      data.issueDate,
      validated.totals.total
    );

    const {
      formattedItems,
      totals,
      taxRate,
      discountRate,
    } = validated;

    const updatedStatus = computeInvoiceStatus(
      inv.status,
      data.dueDate,
      totals.balanceDue
    );

    const itemsJson = JSON.stringify(formattedItems);

    /*
     * Atomic invoice editing for Neon HTTP.
     *
     * The invoice is updated only if its protected
     * values still match the original read.
     *
     * Item deletion and insertion depend on the
     * successful invoice update.
     *
     * All modifications are contained in one SQL
     * statement.
     */

    const result = await db.execute(sql`
      WITH updated_invoice AS (
        UPDATE invoices
        SET
          client_id = ${data.clientId},
          issue_date = ${data.issueDate},
          due_date = ${data.dueDate},
          currency = ${originalCurrency},
          reporting_currency =
            ${conversion.reportingCurrency},
          exchange_rate =
            ${conversion.exchangeRate}::numeric,
          converted_total =
            ${conversion.convertedTotal}::numeric,
          exchange_rate_date =
            ${conversion.exchangeRateDate},
          subtotal = ${totals.subtotal}::numeric,
          tax_rate = ${taxRate}::numeric,
          tax_amount = ${totals.taxAmount}::numeric,
          discount_rate = ${discountRate}::numeric,
          discount_amount =
            ${totals.discountAmount}::numeric,
          total = ${totals.total}::numeric,
          balance_due =
            ${totals.balanceDue}::numeric,
          status = ${updatedStatus},
          notes = ${data.notes?.trim() || null},
          payment_instructions =
            ${data.paymentInstructions?.trim() || null},
          updated_at = NOW()
        WHERE id = ${invoiceId}
          AND business_id = ${businessId}
          AND amount_paid =
            ${inv.amountPaid}::numeric
          AND balance_due =
            ${inv.balanceDue}::numeric
          AND total = ${inv.total}::numeric
          AND currency = ${inv.currency}
AND date_trunc('milliseconds', updated_at)
    IS NOT DISTINCT FROM
    ${inv.updatedAt?.toISOString() || null}::timestamp
          AND EXISTS (
            SELECT 1
            FROM businesses
            WHERE businesses.id = invoices.business_id
              AND businesses.currency = ${biz.currency}
          )
        RETURNING id
      ),

      deleted_items AS (
        DELETE FROM invoice_items
        WHERE invoice_id IN (
          SELECT id FROM updated_invoice
        )
        RETURNING id
      ),

      inserted_items AS (
        INSERT INTO invoice_items (
          invoice_id,
          description,
          quantity,
          unit_price,
          amount,
          sort_order
        )
        SELECT
          updated_invoice.id,
          item.description,
          item.quantity,
          item."unitPrice",
          item.amount,
          item."sortOrder"
        FROM updated_invoice
        CROSS JOIN (
          SELECT COUNT(*) AS deleted_count
          FROM deleted_items
        ) AS deletion_check
CROSS JOIN LATERAL jsonb_to_recordset(
  ${itemsJson}::jsonb
) AS item(
  description text,
  quantity numeric,
  "unitPrice" numeric,
  amount numeric,
  "sortOrder" integer
)
        RETURNING id
      )

      SELECT
        updated_invoice.id,
        (SELECT COUNT(*) FROM inserted_items)
          AS item_count
      FROM updated_invoice
    `);

    const updated = result.rows[0];

    if (!updated) {
      return {
        success: false,
        error:
          "This invoice was modified while you were " +
          "editing it. Please refresh the invoice " +
          "and try again.",
      };
    }

    if (
      Number(updated.item_count) !==
      formattedItems.length
    ) {
      throw new Error(
        "Invoice item update was incomplete. " +
        "Please refresh and check the invoice."
      );
    }

    revalidateInvoicePages(invoiceId);

    return {
      success: true,
    };
  } catch (err) {
    console.error("Invoice update failed:", err);

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Unable to update invoice.",
    };
  }
}

export async function markInvoiceSharedAction(
  invoiceId: string
) {
  const session = await getCustomerSession();

  if (!session || !session.businessId) {
    return {
      success: false,
      error: "Unauthorized.",
    };
  }

  const [inv] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.id, invoiceId),
        eq(invoices.businessId, session.businessId)
      )
    );

  if (!inv) {
    return {
      success: false,
      error: "Invoice not found.",
    };
  }

  if (inv.status === "DRAFT") {
    await db
      .update(invoices)
      .set({
        status: "SENT",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.businessId, session.businessId)
        )
      );
  }

  await db.execute(sql`
    INSERT INTO activity_logs (
      business_id,
      user_id,
      action,
      details
    )
    VALUES (
      ${session.businessId},
      ${session.userId},
      'SHARED_WHATSAPP',
      ${`Initiated WhatsApp share for invoice ${inv.number}`}
    )
  `);

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/analytics");

  return {
    success: true,
  };
}
