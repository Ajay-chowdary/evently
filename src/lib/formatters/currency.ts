const DEFAULT_LOCALE = "en-US";

export function formatCurrency(amount: number, currency = "USD", locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
