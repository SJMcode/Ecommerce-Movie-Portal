"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// server action
// updates one cart item quantity
// quantity can not go below 1
// quantity can not go above movie stock

export async function updateCartItemQuantity(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return;
  }

  const cartItemId = formData.get("cartItemId");
  const quantityValue = formData.get("quantity");

  if (typeof cartItemId !== "string" || cartItemId.length === 0) {
    return;
  }

  const nextQuantity = Number(quantityValue);

  if (!Number.isInteger(nextQuantity)) {
    return;
  }

  const cartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      cart: {
        userId: session.user.id,
      },
    },
    select: {
      id: true,
      movie: {
        select: {
          stock: true,
        },
      },
    },
  });

  if (!cartItem) {
    return;
  }

  const maxQuantity = Math.max(1, cartItem.movie.stock);
  const safeQuantity = Math.min(Math.max(1, nextQuantity), maxQuantity);

  await prisma.cartItem.update({
    where: {
      id: cartItem.id,
    },
    data: {
      quantity: safeQuantity,
    },
  });

  revalidatePath("/cart");
  revalidatePath("/", "layout");
}