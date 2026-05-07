import { describe, expect, it } from "vitest";
import { computeServiceFee, computeTotals } from "./pricing";
import { SERVICE_FEE_MAX_USD, SERVICE_FEE_RATE } from "./constants";

describe("computeServiceFee", () => {
  it("returns 0 for a $0 subtotal", () => {
    expect(computeServiceFee(0)).toBe(0);
  });

  it("applies the configured rate", () => {
    expect(computeServiceFee(50)).toBeCloseTo(50 * SERVICE_FEE_RATE, 2);
    expect(computeServiceFee(20)).toBeCloseTo(2, 2);
  });

  it("caps at the max fee for large subtotals", () => {
    // Pick a subtotal high enough that the raw rate exceeds the cap.
    const huge = SERVICE_FEE_MAX_USD * 100;
    expect(computeServiceFee(huge)).toBe(SERVICE_FEE_MAX_USD);
  });

  it("rounds to cents (no floating-point cruft)", () => {
    // 33.33 * 0.10 = 3.333 → cents-rounded to 3.33
    expect(computeServiceFee(33.33)).toBe(3.33);
  });
});

describe("computeTotals", () => {
  it("sums subtotal + serviceFee into total", () => {
    const r = computeTotals(50, "USD");
    expect(r.subtotal).toBe(50);
    expect(r.serviceFee).toBe(5);
    expect(r.total).toBe(55);
    expect(r.currency).toBe("USD");
  });

  it("preserves the requested currency", () => {
    expect(computeTotals(10, "EUR").currency).toBe("EUR");
  });

  it("handles a free ($0) line total", () => {
    const r = computeTotals(0, "USD");
    expect(r).toEqual({ subtotal: 0, serviceFee: 0, total: 0, currency: "USD" });
  });

  it("never produces a total below subtotal", () => {
    for (const amt of [1, 9.99, 50, 250, 1000]) {
      const r = computeTotals(amt, "USD");
      expect(r.total).toBeGreaterThanOrEqual(r.subtotal);
    }
  });
});
