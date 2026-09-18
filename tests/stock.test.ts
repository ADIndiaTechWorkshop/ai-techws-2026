import { describe, expect, it } from "vitest";
import { planStock } from "../src/lib/stock";

describe("stock", () => {
  it("rejects when qty exceeds remaining", () => {
    expect(() =>
      planStock([{ productId: "a", qty: 2, stockQty: 1 }]),
    ).toThrow(/insufficient/i);
  });
  it("returns decremented quantities on success", () => {
    expect(planStock([{ productId: "a", qty: 2, stockQty: 5 }])).toEqual([
      { productId: "a", next: 3 },
    ]);
  });
  it("does not decrement any line if one fails", () => {
    expect(() =>
      planStock([
        { productId: "a", qty: 1, stockQty: 5 },
        { productId: "b", qty: 3, stockQty: 2 },
      ]),
    ).toThrow(/insufficient/i);
  });
});
