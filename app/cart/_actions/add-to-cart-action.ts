"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// server action
// this runs on the server and writes to the database

type AddToCartResult = {
  ok: boolean;
  message: string;
};

export async function addMovieToCart(
  movieId: string,
): Promise<AddToCartResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // cart belongs to a signed-in user
  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Please sign in before adding movies to your cart.",
    };
  }

  const movie = await prisma.movie.findUnique({
    where: {
      id: movieId,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!movie) {
    return {
      ok: false,
      message: "Movie was not found.",
    };
  }

  // user can have one active cart
  // if cart does not exist yet, create it
  const cart = await prisma.cart.upsert({
    where: {
      userId: session.user.id,
    },
    create: {
      userId: session.user.id,
    },
    update: {},
    select: {
      id: true,
    },
  });

  // if movie is already in cart, increase quantity
  // if not, create a new cart item
  await prisma.cartItem.upsert({
    where: {
      cartId_movieId: {
        cartId: cart.id,
        movieId: movie.id,
      },
    },
    create: {
      cartId: cart.id,
      movieId: movie.id,
      quantity: 1,
    },
    update: {
      quantity: {
        increment: 1,
      },
    },
  });

  revalidatePath("/cart");

  return {
    ok: true,
    message: `${movie.title} was added to your cart.`,
  };
}