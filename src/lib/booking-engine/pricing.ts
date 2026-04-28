import { SERVICE_FEE_MAX_USD, SERVICE_FEE_RATE } from "./constants";

export function computeServiceFee(subtotal: number): number {
  const raw = subtotal * SERVICE_FEE_RATE;
  return Math.min(Math.round(raw * 100) / 100, SERVICE_FEE_MAX_USD);
}

export function computeTotals(
  lineTotal: number,
  currency: string,
): { subtotal: number; serviceFee: number; total: number; currency: string } {
  const subtotal = Math.round(lineTotal * 100) / 100;
  const serviceFee = computeServiceFee(subtotal);
  const total = Math.round((subtotal + serviceFee) * 100) / 100;
  return { subtotal, serviceFee, total, currency };
}
