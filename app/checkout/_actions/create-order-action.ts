"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import z from "zod";

const checkoutSchema = z.object({
  name: z.string().min(1, "Full name is required").max(50),
  email: z.string().email("Invalid email address"),
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must be exactly 16 digits"),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, "Expiry must be MM/YY"),
  cardCvc: z.string().regex(/^\d{3,4}$/, "CVC must be 3 or 4 digits"),
});

type CheckoutInput = z.infer<typeof checkoutSchema>;

type OrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

export async function createOrder(values: CheckoutInput): Promise<OrderResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, error: "You must be signed in to checkout." };
  }

  // 1. Validate Form Inputs
  const parsed = checkoutSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0].message };
  }

  // 2. Retrieve Cart and Items
  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          movie: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  // 3. Verify Stock before proceeding
  for (const item of cart.items) {
    if (item.movie.stock < item.quantity) {
      return {
        ok: false,
        error: `Insufficient stock for "${item.movie.title}". Only ${item.movie.stock} copies left.`,
      };
    }
  }

  // Calculate total amount
  const totalAmount = cart.items.reduce((sum, item) => {
    return sum + Number(item.movie.price) * item.quantity;
  }, 0);

  try {
    // 4. Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // a. Create the Order
      const newOrder = await tx.order.create({
        data: {
          userId: session.user.id,
          totalAmount: totalAmount,
          status: "paid", // Mock payment success
        },
      });

      // b. Create Order Items and update Movie Stock
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            movieId: item.movie.id,
            quantity: item.quantity,
            unitPriceAtPurchase: item.movie.price,
          },
        });

        await tx.movie.update({
          where: { id: item.movie.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // c. Clear the Cart Items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return { ok: true, orderId: result.id };
  } catch (error: any) {
    console.error("Checkout Transaction Error:", error);
    return { ok: false, error: "Failed to place order. Please try again." };
  }
}
