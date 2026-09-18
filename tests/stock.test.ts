import { describe, expect, it } from "vitest";
import { assertAndDecrement, planStock } from "../src/lib/stock";

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

describe("assertAndDecrement", () => {
  it("succeeds when updateMany count is 1", async () => {
    const tx = {
      product: {
        updateMany: async () => ({ count: 1 }),
      },
    };
    await expect(
      assertAndDecrement(tx, [{ productId: "a", qty: 1 }]),
    ).resolves.toBeUndefined();
  });

  it("throws when updateMany count is 0", async () => {
    const tx = {
      product: {
        updateMany: async () => ({ count: 0 }),
      },
    };
    await expect(
      assertAndDecrement(tx, [{ productId: "a", qty: 2 }]),
    ).rejects.toThrow(/insufficient/i);
  });

  it("stops after a failed line (no partial success at caller)", async () => {
    let calls = 0;
    const tx = {
      product: {
        updateMany: async () => {
          calls += 1;
          return { count: calls === 1 ? 1 : 0 };
        },
      },
    };
    await expect(
      assertAndDecrement(tx, [
        { productId: "a", qty: 1 },
        { productId: "b", qty: 1 },
      ]),
    ).rejects.toThrow(/insufficient/i);
    expect(calls).toBe(2);
  });
});
