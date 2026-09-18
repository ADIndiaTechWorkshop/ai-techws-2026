import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/session";

export type AdminSession = {
  userId: string;
  role: Role;
  email: string;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) return null;
  return session;
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    redirect("/signin");
  }
  return session;
}
