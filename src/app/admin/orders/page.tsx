import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { advanceOrder } from "@/app/actions/admin";
import { formatRupees } from "@/app/admin/_format";

function actionLabel(status: OrderStatus): string | null {
  switch (status) {
    case OrderStatus.CONFIRMED:
      return "Start processing";
    case OrderStatus.PROCESSING:
      return "Mark shipped";
    case OrderStatus.SHIPPED:
      return "Mark delivered";
    default:
      return null;
  }
}

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    where: { status: { not: OrderStatus.DELIVERED } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-ink">Open orders</h2>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-canvas text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No open orders.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const label = actionLabel(order.status);
                return (
                  <tr
                    key={order.id}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-ink">{order.id}</td>
                    <td className="px-4 py-3 text-muted">
                      {order.createdAt.toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">{formatRupees(order.totalPaise)}</td>
                    <td className="px-4 py-3">{order.status}</td>
                    <td className="px-4 py-3">
                      {label ? (
                        <form
                          action={async () => {
                            "use server";
                            await advanceOrder(order.id);
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-md border border-navy px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy hover:text-white"
                          >
                            {label}
                          </button>
                        </form>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
