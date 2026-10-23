import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  calculateInvoiceTotals,
  formatMoneyDecimal,
  isInvoiceOverdue,
  computeInvoiceStatus,
} from "./invoices/calculations";
import { normalizeWhatsAppPhone, isValidPhone } from "./whatsapp/phone";
import { buildWhatsAppClickToChatUrl, interpolateTemplate } from "./whatsapp/message";
import { getPlanConfig } from "../config/plans";

describe("Financial Calculations Engine", () => {
  it("formats decimal numbers safely to 2 decimal places", () => {
    assert.equal(formatMoneyDecimal(10.5), "10.50");
    assert.equal(formatMoneyDecimal("100.3333"), "100.33");
    assert.equal(formatMoneyDecimal(0), "0.00");
  });

  it("calculates subtotal, tax, discount, total and balance due accurately", () => {
    const items = [
      { quantity: 2, unitPrice: 50 }, // 100
      { quantity: 1, unitPrice: 200 }, // 200
    ];
    // subtotal = 300
    // tax 10% = 30
    // discount 5% = 15
    // total = 315
    // amount paid = 100
    // balance due = 215
    const result = calculateInvoiceTotals(items, 10, 5, 100);

    assert.equal(result.subtotal, "300.00");
    assert.equal(result.taxAmount, "30.00");
    assert.equal(result.discountAmount, "15.00");
    assert.equal(result.total, "315.00");
    assert.equal(result.balanceDue, "215.00");
  });

  it("computes status progression correctly", () => {
    assert.equal(computeInvoiceStatus("SENT", "2026-10-10", "0.00"), "PAID");
    assert.equal(computeInvoiceStatus("DRAFT", "2020-01-01", "100.00"), "DRAFT");
    assert.equal(computeInvoiceStatus("SENT", "2020-01-01", "100.00"), "OVERDUE");
  });
});

describe("WhatsApp Integration Utilities", () => {
  it("normalizes phone numbers to WhatsApp E.164 format", () => {
    assert.equal(normalizeWhatsAppPhone("+1 (415) 555-0199"), "14155550199");
    assert.equal(normalizeWhatsAppPhone("+44 7700 900077"), "447700900077");
    assert.equal(isValidPhone("+14155550199"), true);
    assert.equal(isValidPhone("123"), false);
  });

  it("interpolates template variables correctly", () => {
    const template = "Hi {client_name}, your invoice {invoice_number} total is {currency} {total}. View: {public_url}";
    const output = interpolateTemplate(template, {
      clientName: "John Doe",
      businessName: "Acme",
      invoiceNumber: "INV-0001",
      currency: "USD",
      total: "250.00",
      balance: "250.00",
      dueDate: "2026-10-01",
      publicUrl: "http://localhost:3000/i/tok_123",
    });

    assert.equal(output, "Hi John Doe, your invoice INV-0001 total is USD 250.00. View: http://localhost:3000/i/tok_123");
  });

  it("builds valid wa.me Click-to-Chat URLs", () => {
    const url = buildWhatsAppClickToChatUrl("+14155550199", "Hello World");
    assert.equal(url, "https://wa.me/14155550199?text=Hello%20World");
  });
});

describe("Subscription Plan Configuration", () => {
  it("returns correct entitlements for Free, Starter and Pro tiers", () => {
    const free = getPlanConfig("FREE");
    assert.equal(free.monthlyInvoiceLimit, 5);
    assert.equal(free.features.removeBranding, false);

    const starter = getPlanConfig("STARTER");
    assert.equal(starter.monthlyInvoiceLimit, 30);
    assert.equal(starter.features.customLogo, true);

    const pro = getPlanConfig("PRO");
    assert.equal(pro.monthlyInvoiceLimit, Infinity);
    assert.equal(pro.features.dataExport, true);
  });
});
