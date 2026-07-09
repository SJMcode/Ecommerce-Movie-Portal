"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

type ModerationResult =
  | { ok: true }
  | { ok: false; error: string };

// Utility to verify if the requesting user is a system administrator
async function verifyAdmin(): Promise<boolean> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return false;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return user?.role === "admin";
}

// 1. BAN USER
export async function banUserAction(
  userId: string,
  reason: string,
  durationDays?: number
): Promise<ModerationResult> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return { ok: false, error: "Unauthorized. Admin privileges required." };
  }

  if (!reason.trim()) {
    return { ok: false, error: "A reason must be provided to ban a user." };
  }

  let banExpires: Date | null = null;
  if (durationDays && durationDays > 0) {
    banExpires = new Date();
    banExpires.setDate(banExpires.getDate() + durationDays);
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: true,
        banReason: reason,
        banExpires,
      },
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (error: any) {
    console.error("Failed to ban user:", error);
    return { ok: false, error: error.message || "Database update failed." };
  }
}

// 2. UNBAN USER
export async function unbanUserAction(userId: string): Promise<ModerationResult> {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return { ok: false, error: "Unauthorized. Admin privileges required." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
      },
    });

    revalidatePath("/admin/users");
    return { ok: true };
  } catch (error: any) {
    console.error("Failed to unban user:", error);
    return { ok: false, error: error.message || "Database update failed." };
  }
}
