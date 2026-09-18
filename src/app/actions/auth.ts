"use server";

import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  getCartLines,
  getWishlistIds,
  setCartLines,
  setWishlistIds,
} from "@/lib/cart-cookie";
import { prisma } from "@/lib/db";
import { createSession, destroySession, getSession } from "@/lib/session";

async function mergeGuestCookies(userId: string): Promise<void> {
  const cartLines = await getCartLines();
  const wishIds = await getWishlistIds();

  if (cartLines.length > 0) {
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    for (const line of cartLines) {
      const product = await prisma.product.findUnique({
        where: { id: line.productId },
      });
      if (!product) continue;

      const existing = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: { cartId: cart.id, productId: line.productId },
        },
      });
      if (existing) {
        await prisma.cartItem.update({
          where: {
            cartId_productId: { cartId: cart.id, productId: line.productId },
          },
          data: { qty: existing.qty + line.qty },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: line.productId,
            qty: line.qty,
          },
        });
      }
    }
    await setCartLines([]);
  }

  if (wishIds.length > 0) {
    for (const productId of wishIds) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) continue;

      await prisma.wishlistItem.upsert({
        where: {
          userId_productId: { userId, productId },
        },
        create: { userId, productId },
        update: {},
      });
    }
    await setWishlistIds([]);
  }
}

export async function login(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect("/signin?error=invalid");
  }

  await createSession(user.id);
  await mergeGuestCookies(user.id);
  redirect("/");
}

export async function register(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || password.length < 8) {
    redirect("/signin?mode=register&error=weak");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect("/signin?mode=register&error=exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, role: Role.BUYER },
  });

  await createSession(user.id);
  await mergeGuestCookies(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/");
}

export async function lookupOrder(formData: FormData): Promise<void> {
  const orderId = String(formData.get("orderId") ?? "").trim();
  if (!orderId) {
    redirect("/track?error=missing");
  }
  redirect(`/orders/${encodeURIComponent(orderId)}`);
}

export async function addAddress(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) {
    redirect("/signin");
  }

  const name = String(formData.get("name") ?? "").trim();
  const line1 = String(formData.get("line1") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const postal = String(formData.get("postal") ?? "").trim();

  if (!name || !line1 || !city || !postal) {
    redirect("/account/addresses?error=invalid");
  }

  await prisma.address.create({
    data: {
      userId: session.userId,
      name,
      line1,
      city,
      postal,
    },
  });

  redirect("/account/addresses");
}
