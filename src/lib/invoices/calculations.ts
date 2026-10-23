export interface LineItemInput {
  quantity: number | string;
  unitPrice: number | string;
}

export interface InvoiceCalculationResult {
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  balanceDue: string;
}

const MONEY_SCALE = 100n;
const MAX_MONEY_CENTS = 999999999999n;

function parseDecimal(value: number | string, decimalPlaces = 2): bigint {
  const input = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(input)) {
    throw new Error(`Invalid numeric value: ${input}`);
  }
  const negative = input.startsWith("-");
  const [whole, fraction = ""] = (negative ? input.slice(1) : input).split(".");
  const scale = 10n ** BigInt(decimalPlaces);
  const padded = fraction.padEnd(decimalPlaces + 1, "0");
  let result = BigInt(whole) * scale + BigInt(padded.slice(0, decimalPlaces) || "0");
  if (Number(padded[decimalPlaces] || "0") >= 5) result += 1n;
  return negative ? -result : result;
}

function divideAndRound(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n || numerator < 0n) throw new Error("Invalid calculation.");
  return (numerator + denominator / 2n) / denominator;
}

function centsToString(cents: bigint): string {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  return `${negative ? "-" : ""}${abs / MONEY_SCALE}.${String(abs % MONEY_SCALE).padStart(2, "0")}`;
}

function validateMoneyRange(cents: bigint): void {
  if (cents < 0n || cents > MAX_MONEY_CENTS) {
    throw new Error("Monetary amount is outside the allowed range.");
  }
}

export function formatMoneyDecimal(value: number | string): string {
  return centsToString(parseDecimal(value, 2));
}

export function calculateInvoiceTotals(
  items: LineItemInput[],
  taxRateInput: number | string = 0,
  discountRateInput: number | string = 0,
  amountPaidInput: number | string = 0
): InvoiceCalculationResult {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Please add at least one line item.");
  }
  let subtotalCents = 0n;
  for (const item of items) {
    const quantity = parseDecimal(item.quantity, 2);
    const unitPriceCents = parseDecimal(item.unitPrice, 2);
    if (quantity <= 0n) throw new Error("Item quantity must be greater than zero.");
    if (unitPriceCents <= 0n) throw new Error("Item price must be greater than zero.");
    const lineTotalCents = divideAndRound(quantity * unitPriceCents, 100n);
    if (lineTotalCents <= 0n) throw new Error("Line item total must be greater than zero.");
    validateMoneyRange(lineTotalCents);
    subtotalCents += lineTotalCents;
    validateMoneyRange(subtotalCents);
  }

  const taxRate = parseDecimal(taxRateInput, 2);
  const discountRate = parseDecimal(discountRateInput, 2);
  const amountPaidCents = parseDecimal(amountPaidInput, 2);
  if (taxRate < 0n || taxRate > 10000n) throw new Error("Tax rate must be between 0% and 100%.");
  if (discountRate < 0n || discountRate > 10000n) throw new Error("Discount rate must be between 0% and 100%.");
  validateMoneyRange(amountPaidCents);

  const discountAmountCents = divideAndRound(subtotalCents * discountRate, 10000n);
  const discountedSubtotalCents = subtotalCents - discountAmountCents;
  const taxAmountCents = divideAndRound(discountedSubtotalCents * taxRate, 10000n);
  const totalCents = discountedSubtotalCents + taxAmountCents;
  validateMoneyRange(totalCents);
  if (totalCents === 0n && discountRate !== 10000n) {
    throw new Error("Invoice total must be greater than zero unless fully discounted.");
  }
  if (amountPaidCents > totalCents) {
    throw new Error("Amount paid cannot exceed the invoice total.");
  }
  return {
    subtotal: centsToString(subtotalCents),
    taxAmount: centsToString(taxAmountCents),
    discountAmount: centsToString(discountAmountCents),
    total: centsToString(totalCents),
    balanceDue: centsToString(totalCents - amountPaidCents),
  };
}

export function isInvoiceOverdue(dueDateStr: string, balanceDueStr: string): boolean {
  const balance = parseDecimal(balanceDueStr, 2);
  if (balance <= 0n) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr)) throw new Error("Invalid invoice due date.");
  const due = new Date(`${dueDateStr}T00:00:00Z`);
  if (Number.isNaN(due.getTime()) || due.toISOString().slice(0, 10) !== dueDateStr) {
    throw new Error("Invalid invoice due date.");
  }
  const today = new Date();
  const todayStr = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  return dueDateStr < todayStr;
}

export function computeInvoiceStatus(currentStatus: string, dueDateStr: string, balanceDueStr: string): string {
  const balance = parseDecimal(balanceDueStr, 2);
  if (balance === 0n) return "PAID";
  if (currentStatus === "DRAFT") return "DRAFT";
  if (isInvoiceOverdue(dueDateStr, balanceDueStr)) return "OVERDUE";
  return currentStatus;
}
