import Link from "next/link";
import { Shell } from "@/components/chrome/Shell";
import { prisma } from "@/lib/db";
import { formatInr, quoteCart } from "@/lib/money";
import {
  applyDiscountCode,
  getCartState,
  removeFromCart,
  saveForLater,
} from "../actions/cart";

export default async function CartPage() {
  const { lines, code } = await getCartState();
  const products = lines.length
    ? await prisma.product.findMany({
        where: { id: { in: lines.map((l) => l.productId) } },
      })
    : [];
  const byId = new Map(products.map((p) => [p.id, p]));

  let subtotalPaise = 0;
  const rows = lines
    .map((l) => {
      const p = byId.get(l.productId);
      if (!p) return null;
      const lineTotal = p.pricePaise * l.qty;
      subtotalPaise += lineTotal;
      return { line: l, product: p, lineTotal };
    })
    .filter(Boolean) as {
    line: { productId: string; qty: number };
    product: (typeof products)[0];
    lineTotal: number;
  }[];

  const quote = quoteCart(subtotalPaise, code);

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-12 py-10">
        <h1 className="text-2xl font-semibold text-ink">Cart</h1>

        {rows.length === 0 ? (
          <p className="mt-6 text-muted">
            Your cart is empty.{" "}
            <Link href="/" className="text-navy underline">
              Continue shopping
            </Link>
          </p>
        ) : (
          <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
            <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
              {rows.map(({ line, product, lineTotal }) => (
                <li
                  key={line.productId}
                  className="flex flex-wrap items-start justify-between gap-4 p-6"
                >
                  <div>
                    <p className="font-medium text-ink">{product.name}</p>
                    <p className="mt-1 text-sm text-muted">
                      Qty {line.qty} · {formatInr(product.pricePaise)} each
                    </p>
                    <div className="mt-3 flex gap-4 text-sm">
                      <form action={removeFromCart.bind(null, line.productId)}>
                        <button
                          type="submit"
                          className="text-navy hover:underline"
                        >
                          Remove
                        </button>
                      </form>
                      <span className="text-muted">·</span>
                      <form
                        action={saveForLater.bind(null, line.productId)}
                      >
                        <button
                          type="submit"
                          className="text-navy hover:underline"
                        >
                          Save for later
                        </button>
                      </form>
                    </div>
                  </div>
                  <p className="font-medium text-gold">{formatInr(lineTotal)}</p>
                </li>
              ))}
            </ul>

            <aside className="rounded-lg border border-line bg-surface p-6">
              <h2 className="text-lg font-semibold text-ink">Summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd>{formatInr(subtotalPaise)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Discount</dt>
                  <dd>-{formatInr(quote.discountPaise)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd>{formatInr(quote.shippingPaise)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="text-gold">{formatInr(quote.totalPaise)}</dd>
                </div>
              </dl>

              <form action={applyDiscountCode} className="mt-6 space-y-2">
                <label className="text-sm font-medium text-ink">
                  Discount code
                </label>
                <div className="flex gap-2">
                  <input
                    name="code"
                    defaultValue={code ?? ""}
                    placeholder="SAVE20"
                    className="min-w-0 flex-1 rounded-md border border-line px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-line px-4 py-2 text-sm font-medium hover:bg-canvas"
                  >
                    Apply
                  </button>
                </div>
              </form>

              <Link
                href="/checkout"
                className="mt-6 flex w-full items-center justify-center rounded-md bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy/90"
              >
                Checkout
              </Link>
            </aside>
          </div>
        )}
      </div>
    </Shell>
  );
}
