import Link from "next/link";
import { Shell } from "@/components/chrome/Shell";
import { getWishlistIds } from "@/lib/cart-cookie";
import { prisma } from "@/lib/db";
import { formatInr } from "@/lib/money";
import { moveWishToCart } from "../actions/cart";

export default async function WishlistPage() {
  const ids = await getWishlistIds();
  const products = ids.length
    ? await prisma.product.findMany({ where: { id: { in: ids } } })
    : [];

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-12 py-10">
        <h1 className="text-2xl font-semibold text-ink">Wishlist</h1>

        {products.length === 0 ? (
          <p className="mt-6 text-muted">
            No saved items.{" "}
            <Link href="/" className="text-navy underline">
              Browse products
            </Link>
          </p>
        ) : (
          <ul className="mt-8 divide-y divide-line rounded-lg border border-line bg-surface">
            {products.map((product) => (
              <li
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-4 p-6"
              >
                <div>
                  <p className="font-medium text-ink">{product.name}</p>
                  <p className="mt-1 text-gold">{formatInr(product.pricePaise)}</p>
                </div>
                <form action={moveWishToCart.bind(null, product.id)}>
                  <button
                    type="submit"
                    className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90"
                  >
                    Move to cart
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Shell>
  );
}
