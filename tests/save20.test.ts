import { describe, expect, it } from "vitest";
import { discountPaise, quoteCart, shippingPaise } from "../src/lib/money";

describe("SAVE20", () => {
  it("takes 20% floor of subtotal", () => {
    expect(discountPaise(12990, "SAVE20")).toBe(2598);
  });
  it("is case-insensitive and trims", () => {
    expect(discountPaise(10000, " save20 ")).toBe(2000);
  });
  it("ignores unknown codes", () => {
    expect(discountPaise(10000, "SAVE10")).toBe(0);
  });
  it("does not grant free shipping", () => {
    const sub = 40000;
    expect(shippingPaise(sub)).toBe(4900);
    const q = quoteCart(sub, "SAVE20");
    expect(q.discountPaise).toBe(8000);
    expect(q.shippingPaise).toBe(4900);
    expect(q.totalPaise).toBe(36900);
  });
});
