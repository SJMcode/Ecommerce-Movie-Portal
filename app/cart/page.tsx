import Link from "next/link"
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type CartPageItem = {
    id: string;
    movieId: string;
    title: string;
    price: number;
    quantity: number;
    subtotal: number;
}

// format price for display   

function formatPrice(price: number) {
    return `${price.toFixed(2)} kr`;
}

// get cart items for the signed-in user

async function getCartItems(userId: string): Promise<CartPageItem[]> {
    const cart = await prisma.cart.findUnique({
        where: {
            userId,
        },
        select: {
            items: {
                orderBy: {
                    createdAt: "asc",
                },
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

// user has no cart yet
if(!cart) {
    return[];
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

// message used when cart has nothing to show

function EmptyCartState({
  title,
  description,
  showSignIn = false,
}: {
  title: string;
  description: string;
  showSignIn?: boolean;
}) {
  return (
    <div className="mt-10 rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
      <h2 className="text-2xl font-bold text-zinc-100">{title}</h2>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
        {description}
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/movies"
          className="rounded-full bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
        >
          Browse movies
        </Link>

{showSignIn && (
  <Link
    href="/sign-in"
    className="rounded-full border border-zinc-700 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
  >
    Sign in
  </Link>
)}
      </div>
    </div>
  );
}

export default async function CartPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

 // cart belongs to a user, so signed out users cannot have a personal cart here
  if (!session?.user?.id) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-50 sm:px-6 sm:py-16 lg:px-8">
        <section className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-400">
            Cart
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Your cart
          </h1>

<EmptyCartState
  title="Sign in to see your cart."
  description="Your cart is connected to your account, so you need to sign in before reviewing your movies."
  showSignIn
/>
        </section>
      </main>
    );
  }

  const cartItems = await getCartItems(session.user.id);

  const cartTotal = cartItems.reduce((total, item) => {
    return total + item.subtotal;
  }, 0);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-50 sm:px-6 sm:py-16 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-400">
              Cart
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Your cart
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
              Review your selected movies before continuing to checkout.
            </p>
          </div>

          <Link
            href="/movies"
            className="text-sm font-semibold text-red-400 transition hover:text-red-300"
          >
            Continue shopping
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <EmptyCartState
            title="Your cart is empty."
            description="You have not added any movies yet. Browse the movie catalog and choose something good."
          />
        ) : (
          <div className="mt-10 space-y-6">
            <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
              <div className="hidden grid-cols-[1fr_120px_120px_120px] gap-4 border-b border-zinc-800 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 md:grid">
                <p>Movie</p>
                <p className="text-right">Price</p>
                <p className="text-right">Quantity</p>
                <p className="text-right">Subtotal</p>
              </div>

              <div className="divide-y divide-zinc-800">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_120px_120px_120px] md:items-center"
                  >
                    <div>
                      <Link
                        href={`/movies/${item.movieId}`}
                        className="font-semibold text-zinc-100 transition hover:text-red-300"
                      >
                        {item.title}
                      </Link>
                    </div>

                    <div className="flex justify-between text-sm md:block md:text-right">
                      <span className="text-zinc-500 md:hidden">Price</span>
                      <span className="text-zinc-100">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm md:block md:text-right">
                      <span className="text-zinc-500 md:hidden">Quantity</span>
                      <span className="text-zinc-100">{item.quantity}</span>
                    </div>

                    <div className="flex justify-between text-sm font-semibold md:block md:text-right">
                      <span className="text-zinc-500 md:hidden">Subtotal</span>
                      <span className="text-zinc-100">
                        {formatPrice(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-lg font-semibold text-zinc-100">Total</p>

                <p className="text-2xl font-bold text-zinc-50">
                  {formatPrice(cartTotal)}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  href="/movies"
                  className="rounded-full border border-zinc-700 px-6 py-3 text-center text-sm font-semibold text-zinc-100 transition hover:border-zinc-500"
                >
                  Continue shopping
                </Link>

                <Link
                  href="/checkout"
                  className="rounded-full bg-red-500 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-red-600"
                >
                  Continue to checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
 