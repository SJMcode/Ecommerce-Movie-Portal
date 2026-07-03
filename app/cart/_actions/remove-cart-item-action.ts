"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// server action
// removes one item from the signed-in user's cart

export async function removeCartItem(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return;
  }

  const cartItemId = formData.get("cartItemId");

  if (typeof cartItemId !== "string" || cartItemId.length === 0) {
    return;
  }

  await prisma.cartItem.deleteMany({
    where: {
      id: cartItemId,
      cart: {
        userId: session.user.id,
      },
    },
  });

  revalidatePath("/cart");
  revalidatePath("/", "layout");
}