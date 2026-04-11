/**
 * Format a numeric amount with the correct currency symbol and locale-aware
 * thousands separators. Handles currencies commonly used by InvoiceAgent users.
 */

const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string; decimals: number }> = {
  USD: { symbol: "$",  locale: "en-US",  decimals: 2 },
  EUR: { symbol: "€",  locale: "de-DE",  decimals: 2 },
  GBP: { symbol: "£",  locale: "en-GB",  decimals: 2 },
  AUD: { symbol: "A$", locale: "en-AU",  decimals: 2 },
  CAD: { symbol: "C$", locale: "en-CA",  decimals: 2 },
  INR: { symbol: "₹",  locale: "en-IN",  decimals: 2 },  // Indian rupee — lac/lakh comma format
  SGD: { symbol: "S$", locale: "en-SG",  decimals: 2 },
  AED: { symbol: "AED", locale: "ar-AE", decimals: 2 },
  PHP: { symbol: "₱",  locale: "en-PH",  decimals: 2 },
  BRL: { symbol: "R$", locale: "pt-BR",  decimals: 2 },
  JPY: { symbol: "¥",  locale: "ja-JP",  decimals: 0 },  // JPY is traditionally whole numbers
  CNY: { symbol: "¥",  locale: "zh-CN",  decimals: 2 },
  NZD: { symbol: "NZ$", locale: "en-NZ", decimals: 2 },
  // fallback
};

export function formatCurrency(amount: number, currency: string): string {
  const upper = currency.toUpperCase();
  const config = CURRENCY_CONFIG[upper];

  if (!config) {
    // Unknown currency — fall back to "USD 1,234.56" style
    return `${currency} ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const formatted = amount.toLocaleString(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });

  // INR uses lac/lakh formatting via en-IN but we still prepend the symbol
  if (upper === "INR") {
    return `₹${formatted}`;
  }

  // For currencies whose symbol already includes the letter (A$, C$, etc.) just prepend
  return `${config.symbol}${formatted}`;
}
