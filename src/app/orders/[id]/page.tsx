import Link from "next/link";
import { notFound } from "next/navigation";
import type { OrderStatus } from "@prisma/client";
import { Shell } from "@/components/chrome/Shell";
import { prisma } from "@/lib/db";
import { formatInr } from "@/lib/money";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "PROCESSING", label: "Processing" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

const STATUS_RANK: Record<OrderStatus, number> = {
  CONFIRMED: 0,
  PROCESSING: 1,
  SHIPPED: 2,
  DELIVERED: 3,
};

function OrderStatusPipeline({ status }: { status: OrderStatus }) {
  const current = STATUS_RANK[status];

  return (
    <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm sm:gap-0">
      {STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step.status} className="flex items-center">
            <span
              className={
                active
                  ? "rounded-full bg-navy px-3 py-1 font-semibold text-white"
                  : done
                    ? "font-medium text-navy"
                    : "text-muted"
              }
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 ? (
              <span
                className={`mx-2 hidden h-px w-8 sm:inline-block ${done ? "bg-navy" : "bg-line"}`}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-12 py-10">
        <p className="text-sm text-muted">
          <Link href="/track" className="text-navy hover:underline">Track</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{order.id}</span>
        </p>

        <h1 className="mt-4 text-2xl font-semibold text-ink">Order {order.id}</h1>
        <p className="mt-2 text-sm text-muted">
          Placed{" "}
          {order.createdAt.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <OrderStatusPipeline status={order.status} />

        <div className="mt-10 overflow-x-auto rounded-lg border border-line bg-surface">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3 text-right">Line total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-ink">{item.nameSnapshot}</td>
                  <td className="px-4 py-3 text-muted">{item.qty}</td>
                  <td className="px-4 py-3 text-right text-ink">
                    {formatInr(item.unitPaise * item.qty)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="mt-6 max-w-sm space-y-2 text-sm">
          <div className="flex justify-between text-muted">
            <dt>Subtotal</dt>
            <dd>{formatInr(order.subtotalPaise)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Discount</dt>
            <dd>−{formatInr(order.discountPaise)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Shipping</dt>
            <dd>{formatInr(order.shippingPaise)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 font-semibold text-ink">
            <dt>Total</dt>
            <dd>{formatInr(order.totalPaise)}</dd>
          </div>
        </dl>

        <p className="mt-8 text-sm text-muted">
          Payment: {order.paymentMethod}
          {order.discountCode ? ` · Code ${order.discountCode}` : ""}
        </p>
      </div>
    </Shell>
  );
}
