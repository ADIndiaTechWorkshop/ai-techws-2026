export function isInsufficientStockError(err: unknown): boolean {
  return err instanceof Error && /insufficient stock/i.test(err.message);
}

export function planStock(
  lines: { productId: string; qty: number; stockQty: number }[],
) {
  for (const l of lines) {
    if (l.qty > l.stockQty) throw new Error("Insufficient stock");
  }
  return lines.map((l) => ({ productId: l.productId, next: l.stockQty - l.qty }));
}

type StockLine = { productId: string; qty: number };

export async function assertAndDecrement(
  tx: { product: { updateMany: Function } },
  lines: StockLine[],
) {
  for (const line of lines) {
    const result = await tx.product.updateMany({
      where: {
        id: line.productId,
        stockQty: { gte: line.qty },
      },
      data: {
        stockQty: { decrement: line.qty },
      },
    });
    if (result.count !== 1) {
      throw new Error("Insufficient stock");
    }
  }
}
