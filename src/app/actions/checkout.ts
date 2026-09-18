"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  clearCartAfterOrder,
  clearCartInTransaction,
  getCartLines,
  getDiscountCode,
} from "@/lib/cart-store";
import { prisma } from "@/lib/db";
import { quoteCart } from "@/lib/money";
import { mockPay } from "@/lib/mock-pay";
import { redis } from "@/lib/redis";
import { getSession } from "@/lib/session";
import { assertAndDecrement } from "@/lib/stock";

function isUniqueOrderIdError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

async function allocateOrderId(
  tx: { order: { count: Function; findUnique: Function } },
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const count = await tx.order.count();
    const orderId = `ORD-${String(count + 1).padStart(4, "0")}`;
    const existing = await tx.order.findUnique({ where: { id: orderId } });
    if (!existing) return orderId;
  }
  throw new Error("Could not allocate order id");
}

export async function placeOrder(formData: FormData) {
  const session = await getSession();
  const lines = await getCartLines();
  if (lines.length === 0) {
    throw new Error("Cart is empty");
  }

  const formEmail = String(formData.get("email") ?? "").trim();
  const email = session?.email ?? formEmail;
  const name = String(formData.get("name") ?? "").trim();
  const line1 = String(formData.get("line1") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postal = String(formData.get("postal") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "razorpay");

  if (!email || !name || !line1 || !city || !postal) {
    throw new Error("Please complete all fields");
  }

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const orderLines = lines.map((l) => {
    const p = byId.get(l.productId);
    if (!p) throw new Error("Product not found");
    return { line: l, product: p };
  });

  let subtotalPaise = 0;
  for (const { line, product } of orderLines) {
    subtotalPaise += product.pricePaise * line.qty;
  }

  const discountCode = await getDiscountCode();
  const quote = quoteCart(subtotalPaise, discountCode);

  await mockPay.authorize({
    amountPaise: quote.totalPaise,
    method: paymentMethod,
  });

  const userId = session?.userId ?? null;
  let orderId = "";

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      orderId = await prisma.$transaction(async (tx) => {
        const id = await allocateOrderId(tx);

        await assertAndDecrement(
          tx,
          lines.map((l) => ({ productId: l.productId, qty: l.qty })),
        );

        await tx.order.create({
          data: {
            id,
            userId: userId ?? undefined,
            guestEmail: userId ? undefined : email,
            status: "CONFIRMED",
            subtotalPaise,
            discountPaise: quote.discountPaise,
            shippingPaise: quote.shippingPaise,
            totalPaise: quote.totalPaise,
            discountCode: discountCode ?? undefined,
            paymentMethod,
            items: {
              create: orderLines.map(({ line, product }) => ({
                productId: product.id,
                nameSnapshot: product.name,
                unitPaise: product.pricePaise,
                qty: line.qty,
              })),
            },
          },
        });

        await tx.address.create({
          data: {
            userId: userId ?? undefined,
            guestEmail: userId ? undefined : email,
            name,
            line1,
            city,
            postal,
          },
        });

        if (userId) {
          await clearCartInTransaction(tx, userId);
        }

        return id;
      });
      break;
    } catch (err) {
      if (isUniqueOrderIdError(err) && attempt < 4) continue;
      throw err;
    }
  }

  if (!orderId) {
    throw new Error("Could not place order");
  }

  await clearCartAfterOrder(userId);

  try {
    await redis.xadd(
      "orders.placed",
      "*",
      "orderId",
      orderId,
      "email",
      email,
      "totalPaise",
      String(quote.totalPaise),
    );
  } catch (err) {
    console.error("orders.placed XADD failed", err);
  }

  redirect(`/orders/${orderId}`);
}
