"use server";

import { redirect } from "next/navigation";
import {
  clearCheckoutCookies,
  getCartLines,
  getDiscountCode,
} from "@/lib/cart-cookie";
import { prisma } from "@/lib/db";
import { quoteCart } from "@/lib/money";
import { mockPay } from "@/lib/mock-pay";
import { redis } from "@/lib/redis";
import { assertAndDecrement, planStock } from "@/lib/stock";

async function nextOrderId(): Promise<string> {
  const count = await prisma.order.count();
  const n = count + 1;
  return `ORD-${String(n).padStart(4, "0")}`;
}

export async function placeOrder(formData: FormData) {
  const lines = await getCartLines();
  if (lines.length === 0) {
    throw new Error("Cart is empty");
  }

  const guestEmail = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const line1 = String(formData.get("line1") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postal = String(formData.get("postal") ?? "").trim();
  const paymentMethod = String(formData.get("paymentMethod") ?? "razorpay");

  if (!guestEmail || !name || !line1 || !city || !postal) {
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

  const orderId = await nextOrderId();

  await prisma.$transaction(async (tx) => {
    const fresh = await tx.product.findMany({
      where: { id: { in: lines.map((l) => l.productId) } },
    });
    const freshById = new Map(fresh.map((p) => [p.id, p]));
    const stockInput = lines.map((line) => {
      const p = freshById.get(line.productId);
      if (!p) throw new Error("Product not found");
      return {
        productId: line.productId,
        qty: line.qty,
        stockQty: p.stockQty,
      };
    });
    const planned = planStock(stockInput);
    await assertAndDecrement(tx, planned);

    await tx.order.create({
      data: {
        id: orderId,
        guestEmail,
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
        guestEmail,
        name,
        line1,
        city,
        postal,
      },
    });
  });

  await redis.xadd(
    "orders.placed",
    "*",
    "orderId",
    orderId,
    "email",
    guestEmail,
    "totalPaise",
    String(quote.totalPaise),
  );

  await clearCheckoutCookies();
  redirect(`/orders/${orderId}`);
}
