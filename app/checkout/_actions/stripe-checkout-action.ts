"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Stripe from "stripe";

// Initialize real Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

type StripeSessionResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function createStripeSession(billingName: string, billingEmail: string): Promise<StripeSessionResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, error: "You must be signed in to checkout." };
  }

  if (!billingName || !billingEmail) {
    return { ok: false, error: "Billing name and email are required." };
  }

  // 1. Retrieve Cart and Items
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

  // 2. Verify Stock
  for (const item of cart.items) {
    if (item.movie.stock < item.quantity) {
      return {
        ok: false,
        error: `Insufficient stock for "${item.movie.title}". Only ${item.movie.stock} copies left.`,
      };
    }
  }

  const totalAmount = cart.items.reduce((sum, item) => {
    return sum + Number(item.movie.price) * item.quantity;
  }, 0);

  try {
    // 3. Create a pending order in our database
    const pendingOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          totalAmount: totalAmount,
          status: "pending",
        },
      });

      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            movieId: item.movie.id,
            quantity: item.quantity,
            unitPriceAtPurchase: item.movie.price,
          },
        });
      }

      return order;
    });

    // --- STRIPE / MOCK FALLBACK LOGIC ---
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn("⚠️ [STRIPE] STRIPE_SECRET_KEY is missing. Falling back to Mock Stripe portal.");
      
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const mockSessionId = `mock_cs_${randomSuffix}`;
      const mockRedirectUrl = `/checkout/mock-stripe?session_id=${mockSessionId}&orderId=${pendingOrder.id}&email=${encodeURIComponent(billingEmail)}`;
      
      return { ok: true, url: mockRedirectUrl };
    }

    // 4. Create Stripe Checkout Session
    const origin = (await headers()).get("origin") || "http://localhost:3000";

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: billingEmail,
      line_items: cart.items.map((item) => ({
        price_data: {
          currency: "sek",
          product_data: {
            name: item.movie.title,
          },
          unit_amount: Math.round(Number(item.movie.price) * 100),
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&orderId=${pendingOrder.id}`,
      cancel_url: `${origin}/checkout`,
      metadata: {
        orderId: pendingOrder.id,
        userId: session.user.id,
      },
    });

    if (!stripeSession.url) {
      return { ok: false, error: "Stripe did not return a valid session URL." };
    }

    return { ok: true, url: stripeSession.url };
  } catch (error: any) {
    console.error("Stripe Session Creation Error:", error);
    return { ok: false, error: `Stripe Error: ${error.message || "Failed to initialize payment gateway."}` };
  }
}
