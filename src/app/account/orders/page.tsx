import Link from "next/link";
import { redirect } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { Shell } from "@/components/chrome/Shell";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function formatStatus(status: OrderStatus): string {
  switch (status) {
    case "CONFIRMED":
      return "Confirmed";
    case "PROCESSING":
      return "Processing";
    case "SHIPPED":
      return "Shipped";
    case "DELIVERED":
      return "Delivered";
    default:
      return status;
  }
}

export default async function AccountOrdersPage() {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-12 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">My orders</h1>
            <p className="mt-2 text-sm text-muted">{session.email}</p>
          </div>
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/account/addresses" className="text-navy hover:underline">
              Addresses
            </Link>
            <Link href="/track" className="text-muted hover:text-navy">
              Track
            </Link>
          </nav>
        </div>

        {orders.length === 0 ? (
          <p className="mt-10 text-sm text-muted">You have no orders yet.</p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-lg border border-line bg-surface">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-line bg-canvas text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((order) => (
                  <tr key={order.id} className="text-ink">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/orders/${order.id}`} className="text-navy hover:underline">
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {order.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">{formatInr(order.totalPaise)}</td>
                    <td className="px-4 py-3">{formatStatus(order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}
