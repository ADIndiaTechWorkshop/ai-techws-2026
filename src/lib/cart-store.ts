import type { CartLine } from "@/lib/cart-cookie";
import {
  clearCheckoutCookies,
  getCartLines as getGuestCartLines,
  getDiscountCode,
  getWishlistIds as getGuestWishlistIds,
  setCartLines as setGuestCartLines,
  setDiscountCode,
  setWishlistIds as setGuestWishlistIds,
} from "@/lib/cart-cookie";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

async function getOrCreateCartId(userId: string): Promise<string> {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart.id;
}

export async function getCartLines(): Promise<CartLine[]> {
  const session = await getSession();
  if (!session) {
    return getGuestCartLines();
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.userId },
    include: { items: true },
  });
  if (!cart) return [];
  return cart.items.map((i) => ({ productId: i.productId, qty: i.qty }));
}

export async function setCartLines(lines: CartLine[]): Promise<void> {
  const session = await getSession();
  if (!session) {
    await setGuestCartLines(lines);
    return;
  }

  const cartId = await getOrCreateCartId(session.userId);
  await prisma.cartItem.deleteMany({ where: { cartId } });
  if (lines.length > 0) {
    await prisma.cartItem.createMany({
      data: lines.map((l) => ({
        cartId,
        productId: l.productId,
        qty: l.qty,
      })),
    });
  }
}

export async function getWishlistIds(): Promise<string[]> {
  const session = await getSession();
  if (!session) {
    return getGuestWishlistIds();
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.userId },
    select: { productId: true },
  });
  return items.map((i) => i.productId);
}

export async function setWishlistIds(ids: string[]): Promise<void> {
  const session = await getSession();
  if (!session) {
    await setGuestWishlistIds(ids);
    return;
  }

  await prisma.wishlistItem.deleteMany({ where: { userId: session.userId } });
  if (ids.length > 0) {
    await prisma.wishlistItem.createMany({
      data: ids.map((productId) => ({
        userId: session.userId,
        productId,
      })),
    });
  }
}

export { getDiscountCode, setDiscountCode };

export async function clearCartAfterOrder(userId: string | null): Promise<void> {
  if (userId) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }
  await clearCheckoutCookies();
}

export async function clearCartInTransaction(
  tx: {
    cart: { findUnique: Function };
    cartItem: { deleteMany: Function };
  },
  userId: string,
): Promise<void> {
  const cart = await tx.cart.findUnique({ where: { userId } });
  if (cart) {
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
  }
}
