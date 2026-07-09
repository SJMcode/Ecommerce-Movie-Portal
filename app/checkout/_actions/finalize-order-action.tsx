"use server";

import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Stripe from "stripe";
import { render, toPlainText } from "react-email";
import { sendEmail } from "@/lib/email";
import OrderConfirmation from "@/components/email/templates/order-confirmation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

type FinalizeResult =
  | { ok: true }
  | { ok: false; error: string };

export async function finalizeOrder(orderId: string, sessionId: string): Promise<FinalizeResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!sessionId) {
    return { ok: false, error: "Missing session ID." };
  }

  const isMock = sessionId.startsWith("mock_cs_");

  try {
    // 1. Verify Payment Status
    if (!isMock) {
      if (!process.env.STRIPE_SECRET_KEY) {
        return { ok: false, error: "Stripe gateway is not configured." };
      }

      // Query Stripe API to verify session status
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
      if (stripeSession.payment_status !== "paid") {
        return { ok: false, error: "Stripe indicates payment has not been authorized." };
      }
    }

    // 2. Fetch the pending order with user and item movie details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            movie: true,
          },
        },
      },
    });

    if (!order) {
      return { ok: false, error: "Order not found." };
    }

    // 3. Finalize Order (Flags status, deducts stock, and clears cart)
    if (order.status === "pending") {
      await prisma.$transaction(async (tx) => {
        // Mark Order as paid
        await tx.order.update({
          where: { id: orderId },
          data: { status: "paid" },
        });

        // Deduct stock for each purchased movie
        for (const item of order.items) {
          await tx.movie.update({
            where: { id: item.movieId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Clear the user's cart items
        const cart = await tx.cart.findUnique({
          where: { userId: order.userId },
        });
        if (cart) {
          await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
        }
      });

      // 4. Send Order Confirmation Email asynchronously
      try {
        const orderItems = order.items.map((item) => ({
          title: item.movie.title,
          quantity: item.quantity,
          price: Number(item.unitPriceAtPurchase),
        }));

        const html = await render(
          <OrderConfirmation
            customerName={order.user.name || "Kund"}
            orderId={order.id}
            items={orderItems}
            totalAmount={Number(order.totalAmount)}
          />
        );
        const text = toPlainText(html);

        await sendEmail(
          order.user.email || "",
          `Order Confirmation #${order.id} - Lonely Rider`,
          text,
          html
        );
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
        // Note: We still return ok: true because the database order and payment are successful
      }
    }

    return { ok: true };
  } catch (error: any) {
    console.error("Error finalizing order:", error);
    return { ok: false, error: error.message || "Failed to finalize order." };
  }
}
