
const FRANKFURTER_API_URL = "https://api.frankfurter.dev/v2";

export interface ExchangeRateResult {
  base: string;
  quote: string;
  rate: number;
  date: string;
}

function validateCurrency(currency: string): string {
  const code = currency.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(code)) {
    throw new Error(`Invalid currency code: ${currency}`);
  }

  return code;
}

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  date?: string
): Promise<ExchangeRateResult> {
  const base = validateCurrency(fromCurrency);
  const quote = validateCurrency(toCurrency);

  if (date && !isValidDate(date)) {
    throw new Error("Invalid exchange-rate date.");
  }

  if (base === quote) {
    return {
      base,
      quote,
      rate: 1,
      date: date || new Date().toISOString().slice(0, 10),
    };
  }

const endpoint = date
  ? `${FRANKFURTER_API_URL}/rates?date=${date}&base=${base}&quotes=${quote}`
  : `${FRANKFURTER_API_URL}/rate/${base}/${quote}`;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error(
      "Unable to connect to the exchange-rate provider."
    );
  }

  if (!response.ok) {
    throw new Error(
      `Exchange-rate provider returned HTTP ${response.status}.`
    );
  }

  const data: unknown = await response.json();
  const rateData = Array.isArray(data)
  ? data.find(
      (item) =>
        item?.base === base &&
        item?.quote === quote
    )
  : data;

if (!rateData || typeof rateData !== "object") {
  throw new Error("Invalid exchange-rate response.");
}

const result = rateData as Record<string, unknown>;

  if (
    result.base !== base ||
    result.quote !== quote ||
    typeof result.rate !== "number" ||
    !Number.isFinite(result.rate) ||
    result.rate <= 0 ||
    typeof result.date !== "string" ||
    !isValidDate(result.date)
  ) {
    throw new Error("Invalid exchange-rate data received.");
  }

  if (date && result.date > date) {
    throw new Error(
      "Exchange-rate provider returned a date later than requested."
    );
  }

  return {
    base,
    quote,
    rate: result.rate,
    date: result.date,
  };
}
