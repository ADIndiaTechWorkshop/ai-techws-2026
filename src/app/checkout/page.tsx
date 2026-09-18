import Link from "next/link";
import { Suspense } from "react";
import { addAddress } from "@/app/actions/auth";
import { Shell } from "@/components/chrome/Shell";
import { CheckoutStockToast } from "@/components/checkout/CheckoutStockToast";
import { getCartLines, getDiscountCode } from "@/lib/cart-store";
import { prisma } from "@/lib/db";
import { formatInr, quoteCart } from "@/lib/money";
import { getSession } from "@/lib/session";
import { placeOrder } from "../actions/checkout";

type PageProps = {
  searchParams: Promise<{ addressId?: string }>;
};

export default async function CheckoutPage({ searchParams }: PageProps) {
  const session = await getSession();
  const { addressId: selectedAddressId } = await searchParams;
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

  const savedAddresses = session
    ? await prisma.address.findMany({
        where: { userId: session.userId },
        orderBy: { id: "asc" },
      })
    : [];

  const defaultAddressId =
    (selectedAddressId &&
      savedAddresses.some((a) => a.id === selectedAddressId) &&
      selectedAddressId) ||
    savedAddresses[0]?.id ||
    "";

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
      <Suspense fallback={null}>
        <CheckoutStockToast />
      </Suspense>
      <div className="mx-auto max-w-[720px] px-12 py-10">
        <h1 className="text-2xl font-semibold text-ink">Checkout</h1>

        <div className="mt-8 space-y-8">
          <form action={placeOrder} className="space-y-8">
          <section className="space-y-4 rounded-lg border border-line bg-surface p-6">
            <h2 className="font-semibold text-ink">Contact</h2>
            <label className="block text-sm">
              <span className="text-muted">Email</span>
              <input
                name="email"
                type="email"
                required
                readOnly={!!session}
                defaultValue={session?.email ?? ""}
                className="mt-1 w-full rounded-md border border-line px-3 py-2"
              />
            </label>
          </section>

          <section className="space-y-4 rounded-lg border border-line bg-surface p-6">
            <h2 className="font-semibold text-ink">Delivery address</h2>
            {session ? (
              <>
                {savedAddresses.length === 0 ? (
                  <p className="text-sm text-muted">
                    Add a saved address below to continue.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {savedAddresses.map((addr) => (
                      <li key={addr.id}>
                        <label
                          className="flex cursor-pointer gap-3 rounded-md border border-line bg-canvas px-4 py-3 text-sm has-[:checked]:border-navy"
                        >
                          <input
                            type="radio"
                            name="addressId"
                            value={addr.id}
                            required
                            defaultChecked={addr.id === defaultAddressId}
                            className="mt-1"
                          />
                          <span className="text-ink">
                            <span className="font-medium">{addr.name}</span>
                            <span className="mt-1 block text-muted">
                              {addr.line1}, {addr.city} {addr.postal}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
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
              disabled={!!session && savedAddresses.length === 0}
              className="mt-4 w-full rounded-md bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Place order
            </button>
          </div>
          </form>

          {session ? (
            <section className="rounded-lg border border-line bg-surface p-6">
              <h2 className="font-semibold text-ink">Add address</h2>
              <form action={addAddress} className="mt-4 space-y-3">
                <input type="hidden" name="returnTo" value="/checkout" />
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
                <div className="grid gap-3 sm:grid-cols-2">
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
                <button
                  type="submit"
                  className="rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium text-navy hover:bg-canvas"
                >
                  Save and use this address
                </button>
              </form>
            </section>
          ) : null}
        </div>
      </div>
    </Shell>
  );
}
