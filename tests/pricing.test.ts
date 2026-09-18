import { describe, expect, it } from "vitest";
import { shippingPaise, quoteCart } from "../src/lib/money";

describe("shipping", () => {
  it("charges 4900 below ₹500", () => {
    expect(shippingPaise(49900)).toBe(4900);
  });
  it("is free at ₹500", () => {
    expect(shippingPaise(50000)).toBe(0);
  });
  it("is free above ₹500", () => {
    expect(shippingPaise(1299000)).toBe(0);
  });
});

describe("quoteCart", () => {
  it("adds shipping to subtotal when below threshold", () => {
    expect(quoteCart(12990, null)).toEqual({
      discountPaise: 0,
      shippingPaise: 4900,
      totalPaise: 17890,
    });
  });
});
