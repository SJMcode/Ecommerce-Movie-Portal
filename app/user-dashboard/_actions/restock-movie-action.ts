"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

type RestockResult =
  | { ok: true }
  | { ok: false; error: string };

export async function restockMovieAction(movieId: string, newStock: number): Promise<RestockResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Security Guard: Check authentication and role
  if (!session) {
    return { ok: false, error: "Unauthorized. Please sign in." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || user.role !== "admin") {
    return { ok: false, error: "Unauthorized. Admin privileges required." };
  }

  // Validate Input
  if (!Number.isInteger(newStock) || newStock < 0) {
    return { ok: false, error: "Stock must be a non-negative integer." };
  }

  try {
    // Update the database record
    await prisma.movie.update({
      where: { id: movieId },
      data: { stock: newStock },
    });

    // Revalidate paths to refresh the UI elements globally
    revalidatePath("/user-dashboard");
    revalidatePath("/movies");

    return { ok: true };
  } catch (error: any) {
    console.error("Failed to restock movie:", error);
    return { ok: false, error: error.message || "Failed to update stock." };
  }
}
