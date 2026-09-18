import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "appstore_session";
const SESSION_DAYS = 30;

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  return secret;
}

function signSessionId(sessionId: string): string {
  const sig = createHmac("sha256", getSecret())
    .update(sessionId)
    .digest("base64url");
  return `${sessionId}.${sig}`;
}

function verifyCookieValue(value: string): string | null {
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const sessionId = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = createHmac("sha256", getSecret())
    .update(sessionId)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return sessionId;
}

export async function getSession(): Promise<{
  userId: string;
  role: Role;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const sessionId = verifyCookieValue(raw);
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    userId: session.userId,
    role: session.user.role,
    email: session.user.email,
  };
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  const session = await prisma.session.create({
    data: { userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signSessionId(session.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (raw) {
    const sessionId = verifyCookieValue(raw);
    if (sessionId) {
      await prisma.session.deleteMany({ where: { id: sessionId } });
    }
  }
  cookieStore.delete(COOKIE_NAME);
}
