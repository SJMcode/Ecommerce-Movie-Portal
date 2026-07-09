import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "./_components/checkout-form";

type CartItem = {
  id: string;
  movieId: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
};

async function getCartItems(userId: string): Promise<CartItem[]> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: {
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          quantity: true,
          movie: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return [];
  }

  return cart.items.map((item) => {
    const price = Number(item.movie.price);
    const safePrice = Number.isFinite(price) ? price : 0;

    return {
      id: item.id,
      movieId: item.movie.id,
      title: item.movie.title,
      price: safePrice,
      quantity: item.quantity,
      subtotal: safePrice * item.quantity,
    };
  });
}

export default async function CheckoutPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in?callbackUrl=/checkout");
  }

  // Enforce email verification
  if (!session.user.emailVerified) {
    return (
      <main className="px-6 min-h-[85vh] flex items-center justify-center">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-12 text-center max-w-xl mx-auto space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-950 border border-red-800">
            <span className="text-red-500 text-xl font-bold">!</span>
          </div>
          <h3 className="text-xl font-bold text-zinc-200">Email Verification Required</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            For security reasons, your email address (<strong>{session.user.email}</strong>) must be verified before you can check out and purchase movies. Please click the verification link we sent to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/user-dashboard/profile"
              className="inline-block rounded-full bg-zinc-800 border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700"
            >
              Go to Profile
            </Link>
            <Link
              href="/movies"
              className="inline-block rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Browse Movies
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Enforce account suspension check from db
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { banned: true, banReason: true },
  });

  if (currentUser?.banned) {
    return (
      <main className="px-6 min-h-[85vh] flex items-center justify-center">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-12 text-center max-w-xl mx-auto space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-950 border border-red-800">
            <span className="text-red-500 text-xl font-bold">!</span>
          </div>
          <h3 className="text-xl font-bold text-zinc-200">Account Suspended</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Your account has been suspended for violating store policies. Purchase privileges have been temporarily or permanently restricted.
          </p>
          {currentUser.banReason && (
            <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 p-3.5 rounded-xl max-w-md mx-auto">
              <strong>Reason:</strong> {currentUser.banReason}
            </p>
          )}
          <div className="flex justify-center">
            <Link
              href="/"
              className="inline-block rounded-full bg-zinc-800 border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const items = await getCartItems(session.user.id);
  const cartTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <main className="px-6 min-h-[85vh]">
      <section className="flex flex-col gap-10 mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-red-400 font-semibold uppercase tracking-wider text-xs">Secure Checkout</h1>
          <h2 className="text-2xl md:text-4xl font-bold text-white">Place Your Order</h2>
          <p className="text-sm text-zinc-400">
            Please verify your items and complete the form below.
          </p>
        </div>

        <div className="h-px bg-zinc-800"></div>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-12 text-center max-w-xl mx-auto space-y-4">
            <h3 className="text-xl font-bold text-zinc-200">Your Cart is Empty</h3>
            <p className="text-sm text-zinc-400">
              You must add some movies to your cart before you can check out.
            </p>
            <Link
              href="/movies"
              className="inline-block rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <CheckoutForm
            items={items}
            cartTotal={cartTotal}
            initialName={session.user.name || ""}
            initialEmail={session.user.email}
          />
        )}
      </section>
    </main>
  );
}