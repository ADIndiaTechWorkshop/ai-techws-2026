import Link from "next/link";
import { Shell } from "@/components/chrome/Shell";
import { getCartLines, getDiscountCode } from "@/lib/cart-cookie";
import { prisma } from "@/lib/db";
import { formatInr, quoteCart } from "@/lib/money";
import { placeOrder } from "../actions/checkout";

export default async function CheckoutPage() {
  const lines = await getCartLines();
  const code = await getDiscountCode();

  if (lines.length === 0) {
    return (
      <Shell>
        <div className="mx-auto max-w-[1440px] px-12 py-10">
          <h1 className="text-2xl font-semibold text-ink">Checkout</h1>
          <p className="mt-4 text-muted">
            Your cart is empty.{" "}
            <Link href="/cart" className="text-navy underline">
              Return to cart
            </Link>
          </p>
        </div>
      </Shell>
    );
  }

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  let subtotalPaise = 0;
  for (const l of lines) {
    const p = byId.get(l.productId);
    if (p) subtotalPaise += p.pricePaise * l.qty;
  }
  const quote = quoteCart(subtotalPaise, code);

  return (
    <Shell>
      <div className="mx-auto max-w-[720px] px-12 py-10">
        <h1 className="text-2xl font-semibold text-ink">Checkout</h1>

        <form action={placeOrder} className="mt-8 space-y-8">
          <section className="space-y-4 rounded-lg border border-line bg-surface p-6">
            <h2 className="font-semibold text-ink">Contact</h2>
            <label className="block text-sm">
              <span className="text-muted">Email</span>
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-md border border-line px-3 py-2"
              />
            </label>
          </section>

          <section className="space-y-4 rounded-lg border border-line bg-surface p-6">
            <h2 className="font-semibold text-ink">Delivery address</h2>
            <label className="block text-sm">
              <span className="text-muted">Full name</span>
              <input
                name="name"
                required
                className="mt-1 w-full rounded-md border border-line px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-muted">Address line</span>
              <input
                name="line1"
                required
                className="mt-1 w-full rounded-md border border-line px-3 py-2"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-muted">City</span>
                <input
                  name="city"
                  required
                  className="mt-1 w-full rounded-md border border-line px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted">Postal code</span>
                <input
                  name="postal"
                  required
                  className="mt-1 w-full rounded-md border border-line px-3 py-2"
                />
              </label>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-line bg-surface p-6">
            <h2 className="font-semibold text-ink">Payment</h2>
            {[
              { value: "billdesk", label: "Bill Desk" },
              { value: "razorpay", label: "Razorpay" },
              { value: "upi", label: "UPI" },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={opt.value}
                  defaultChecked={opt.value === "razorpay"}
                />
                {opt.label}
              </label>
            ))}
          </section>

          <div className="rounded-lg border border-line bg-surface p-6">
            <p className="text-sm text-muted">
              Order total:{" "}
              <span className="font-semibold text-gold">
                {formatInr(quote.totalPaise)}
              </span>
            </p>
            <button
              type="submit"
              className="mt-4 w-full rounded-md bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy/90"
            >
              Place order
            </button>
          </div>
        </form>
      </div>
    </Shell>
  );
}
