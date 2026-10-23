import { normalizeWhatsAppPhone } from "./phone";

export interface InvoiceMessageParams {
  clientName: string;
  businessName: string;
  invoiceNumber: string;
  currency: string;
  total: string;
  balance: string;
  dueDate: string;
  daysOverdue?: number;
  publicUrl: string;
}

export const DEFAULT_REMINDER_TEMPLATES: Record<string, { name: string; template: string }> = {
  invoice_share: {
    name: "Invoice Share",
    template: "Hello {client_name},\n\nHere is your invoice {invoice_number} from {business_name}.\n\nTotal: {currency} {total}\nBalance Due: {currency} {balance}\nDue Date: {due_date}\n\nYou can view your invoice and payment instructions here:\n{public_url}\n\nThank you!",
  },
  friendly: {
    name: "Friendly Reminder",
    template: "Hi {client_name},\n\nHope you are well! Just a friendly reminder regarding invoice {invoice_number} ({currency} {balance}) from {business_name}, due on {due_date}.\n\nView invoice: {public_url}\n\nThanks!",
  },
  due_today: {
    name: "Due Today",
    template: "Hi {client_name},\n\nThis is a reminder that invoice {invoice_number} from {business_name} for {currency} {balance} is due today ({due_date}).\n\nPayment link & instructions:\n{public_url}\n\nThank you!",
  },
  overdue: {
    name: "Overdue Notice",
    template: "Hi {client_name},\n\nNotice: Invoice {invoice_number} from {business_name} for {currency} {balance} was due on {due_date} ({days_overdue} days ago).\n\nPlease review and settle payment here:\n{public_url}\n\nThank you!",
  },
  final: {
    name: "Final Reminder",
    template: "FINAL NOTICE: Hi {client_name}, invoice {invoice_number} for {currency} {balance} is overdue. Please settle this outstanding payment immediately.\n\nLink: {public_url}",
  },
};

/**
 * Interpolates variables into template body
 */
export function interpolateTemplate(template: string, params: InvoiceMessageParams): string {
  return template
    .replace(/{client_name}/g, params.clientName)
    .replace(/{business_name}/g, params.businessName)
    .replace(/{invoice_number}/g, params.invoiceNumber)
    .replace(/{currency}/g, params.currency)
    .replace(/{total}/g, params.total)
    .replace(/{balance}/g, params.balance)
    .replace(/{due_date}/g, params.dueDate)
    .replace(/{days_overdue}/g, (params.daysOverdue ?? 0).toString())
    .replace(/{public_url}/g, params.publicUrl);
}

/**
 * Builds WhatsApp Click-to-Chat URL
 * Format: https://wa.me/PHONE?text=ENCODED_TEXT
 */
export function buildWhatsAppClickToChatUrl(phone: string, message: string): string {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
}
