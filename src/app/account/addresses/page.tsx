import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/chrome/Shell";
import { addAddress } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export default async function AccountAddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }

  const { error } = await searchParams;

  const addresses = await prisma.address.findMany({
    where: { userId: session.userId },
    orderBy: { id: "asc" },
  });

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-12 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Saved addresses</h1>
            <p className="mt-2 text-sm text-muted">{session.email}</p>
          </div>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/account/orders" className="text-muted hover:text-navy">
              My orders
            </Link>
            <Link href="/track" className="text-muted hover:text-navy">
              Track
            </Link>
          </nav>
        </div>

        {error === "invalid" ? (
          <p className="mt-4 rounded-md border border-line bg-canvas px-3 py-2 text-sm text-navy">
            Please fill in all address fields.
          </p>
        ) : null}

        <ul className="mt-8 flex flex-col gap-4">
          {addresses.length === 0 ? (
            <li className="text-sm text-muted">No saved addresses yet.</li>
          ) : (
            addresses.map((addr) => (
              <li
                key={addr.id}
                className="rounded-lg border border-line bg-surface px-5 py-4 text-sm text-ink"
              >
                <p className="font-medium">{addr.name}</p>
                <p className="mt-1 text-muted">{addr.line1}</p>
                <p className="text-muted">
                  {addr.city}, {addr.postal}
                </p>
              </li>
            ))
          )}
        </ul>

        <section className="mt-10 max-w-lg rounded-lg border border-line bg-surface p-6">
          <h2 className="text-lg font-semibold text-ink">Add address</h2>
          <form action={addAddress} className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Full name
              <input
                name="name"
                required
                className="rounded-md border border-line px-4 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Address line
              <input
                name="line1"
                required
                className="rounded-md border border-line px-4 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              City
              <input
                name="city"
                required
                className="rounded-md border border-line px-4 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
              Postal code
              <input
                name="postal"
                required
                className="rounded-md border border-line px-4 py-2.5 font-normal focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
            </label>
            <button
              type="submit"
              className="mt-2 w-fit rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy/90"
            >
              Add address
            </button>
          </form>
        </section>
      </div>
    </Shell>
  );
}
