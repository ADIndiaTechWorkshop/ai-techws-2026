import { cookies } from "next/headers";

export type CartLine = { productId: string; qty: number };

const CART_COOKIE = "appstore_cart";
const WISH_COOKIE = "appstore_wish";
const CODE_COOKIE = "appstore_code";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

function parseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getCartLines(): Promise<CartLine[]> {
  const jar = await cookies();
  return parseJson<CartLine[]>(jar.get(CART_COOKIE)?.value, []);
}

export async function setCartLines(lines: CartLine[]): Promise<void> {
  const jar = await cookies();
  if (lines.length === 0) {
    jar.delete(CART_COOKIE);
  } else {
    jar.set(CART_COOKIE, JSON.stringify(lines), cookieOpts);
  }
}

export async function getWishlistIds(): Promise<string[]> {
  const jar = await cookies();
  return parseJson<string[]>(jar.get(WISH_COOKIE)?.value, []);
}

export async function setWishlistIds(ids: string[]): Promise<void> {
  const jar = await cookies();
  if (ids.length === 0) {
    jar.delete(WISH_COOKIE);
  } else {
    jar.set(WISH_COOKIE, JSON.stringify(ids), cookieOpts);
  }
}

export async function getDiscountCode(): Promise<string | null> {
  const jar = await cookies();
  const v = jar.get(CODE_COOKIE)?.value;
  return v ?? null;
}

export async function setDiscountCode(code: string | null): Promise<void> {
  const jar = await cookies();
  if (!code?.trim()) {
    jar.delete(CODE_COOKIE);
  } else {
    jar.set(CODE_COOKIE, code.trim(), cookieOpts);
  }
}

export async function clearCheckoutCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(CART_COOKIE);
  jar.delete(CODE_COOKIE);
}
