import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { advanceOrder } from "@/app/actions/admin";

const PIPELINE_COPY = "Confirmed  →  Processing  →  Shipped  →  Delivered";

function statusLabel(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.CONFIRMED:
      return "Confirmed";
    case OrderStatus.PROCESSING:
      return "Processing";
    case OrderStatus.SHIPPED:
      return "Shipped";
    case OrderStatus.DELIVERED:
      return "Delivered";
    default:
      return status;
  }
}

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
      <h2 className="text-2xl font-bold text-ink">Process orders</h2>

      {orders.length === 0 ? (
        <p className="text-sm text-muted">No open orders.</p>
      ) : (
        <ul className="space-y-8">
          {orders.map((order) => {
            const label = actionLabel(order.status);
            return (
              <li key={order.id} className="space-y-2">
                <p className="text-base font-semibold text-ink">
                  {order.id}
                  <span className="font-semibold"> · </span>
                  {statusLabel(order.status)}
                </p>
                <p className="text-sm text-muted">{PIPELINE_COPY}</p>
                {label ? (
                  <form
                    action={async () => {
                      "use server";
                      await advanceOrder(order.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-lg bg-navy px-5 py-3 text-sm font-medium text-white hover:bg-navy/90"
                    >
                      {label}
                    </button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
