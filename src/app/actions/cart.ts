"use server";

import { redirect } from "next/navigation";
import {
  getCartLines,
  getDiscountCode,
  getWishlistIds,
  setCartLines,
  setDiscountCode,
  setWishlistIds,
} from "@/lib/cart-store";

function mergeLine(
  lines: { productId: string; qty: number }[],
  productId: string,
  qty: number,
) {
  const idx = lines.findIndex((l) => l.productId === productId);
  if (idx === -1) {
    lines.push({ productId, qty });
  } else {
    lines[idx] = { productId, qty: lines[idx].qty + qty };
  }
  return lines;
}

export async function addToCart(productId: string, qty = 1) {
  const lines = await getCartLines();
  await setCartLines(mergeLine([...lines], productId, qty));
}

export async function addToCartAndRedirect(productId: string, qty = 1) {
  await addToCart(productId, qty);
  redirect("/cart");
}

export async function buyNow(productId: string) {
  await addToCart(productId, 1);
  redirect("/checkout");
}

export async function removeFromCart(productId: string) {
  const lines = (await getCartLines()).filter((l) => l.productId !== productId);
  await setCartLines(lines);
}

export async function saveForLater(productId: string) {
  const lines = (await getCartLines()).filter((l) => l.productId !== productId);
  await setCartLines(lines);
  const wish = await getWishlistIds();
  if (!wish.includes(productId)) {
    await setWishlistIds([...wish, productId]);
  }
}

export async function moveWishToCart(productId: string) {
  const wish = (await getWishlistIds()).filter((id) => id !== productId);
  await setWishlistIds(wish);
  const lines = await getCartLines();
  await setCartLines(mergeLine([...lines], productId, 1));
}

export async function applyDiscountCode(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  await setDiscountCode(code || null);
}

export async function getCartState() {
  const lines = await getCartLines();
  const code = await getDiscountCode();
  return { lines, code };
}
