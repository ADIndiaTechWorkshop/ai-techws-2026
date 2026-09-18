export function planStock(
  lines: { productId: string; qty: number; stockQty: number }[],
) {
  for (const l of lines) {
    if (l.qty > l.stockQty) throw new Error("Insufficient stock");
  }
  return lines.map((l) => ({ productId: l.productId, next: l.stockQty - l.qty }));
}

export async function assertAndDecrement(
  tx: { product: { update: Function } },
  planned: { productId: string; next: number }[],
) {
  for (const p of planned) {
    await tx.product.update({
      where: { id: p.productId },
      data: { stockQty: p.next },
    });
  }
}
