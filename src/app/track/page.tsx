import Link from "next/link";
import { Shell } from "@/components/chrome/Shell";
import { lookupOrder } from "@/app/actions/auth";

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-12 py-10">
        <h1 className="text-2xl font-semibold text-ink">Track your order</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your order ID (for example ORD-0001). No sign-in required.
        </p>

        {error === "missing" ? (
          <p className="mt-4 text-sm text-red-700">Please enter an order ID.</p>
        ) : null}

        <form action={lookupOrder} className="mt-8 flex max-w-lg flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm font-medium text-ink">
            Order ID
            <input
              type="text"
              name="orderId"
              placeholder="ORD-0001"
              className="rounded-md border border-line bg-surface px-4 py-2.5 font-normal text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-navy px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
          >
            Look up
          </button>
        </form>

        <p className="mt-8 text-sm text-muted">
          Signed in? View all orders on{" "}
          <Link href="/account/orders" className="font-medium text-navy hover:underline">
            My orders
          </Link>
          .
        </p>
      </div>
    </Shell>
  );
}
