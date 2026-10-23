/**
 * Normalizes phone numbers to WhatsApp Click-to-Chat E.164 international format (digits only, no +, no spaces, no dashes)
 * Example: "+1 (415) 555-0199" -> "14155550199"
 * Example: "+44 7700 900077" -> "447700900077"
 */
export function normalizeWhatsAppPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  // Strip non-digit characters
  const digits = phone.replace(/\D/g, "");
  return digits;
}

/**
 * Validates whether a phone number appears to be a valid phone number with length between 7 and 15 digits
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  const normalized = normalizeWhatsAppPhone(phone);
  return normalized.length >= 7 && normalized.length <= 15;
}
