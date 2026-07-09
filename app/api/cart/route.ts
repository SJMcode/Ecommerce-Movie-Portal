import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get cart items
 *     description: Returns a list of items inside the active user's cart. Requires session authentication.
 *     tags:
 *       - Cart
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 * 
 *   post:
 *     summary: Add item to cart
 *     description: Adds a movie to the active user's cart or increments the quantity if it already exists. Requires session authentication.
 *     tags:
 *       - Cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movieId
 *             properties:
 *               movieId:
 *                 type: string
 *                 example: "movie_uuid_here"
 *               quantity:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Item added successfully.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 * 
 *   delete:
 *     summary: Remove item from cart
 *     description: Removes a specific cart item by its ID. Requires session authentication.
 *     tags:
 *       - Cart
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique CartItem ID
 *     responses:
 *       200:
 *         description: Item removed successfully.
 *       400:
 *         description: Bad request.
 *       401:
 *         description: Unauthorized.
 */

// 1. GET: Read cart items
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  try {
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

    return NextResponse.json(cart || { items: [] });
  } catch (error) {
    console.error("GET /api/cart failed:", error);
    return NextResponse.json({ error: "Failed to fetch cart." }, { status: 500 });
  }
}

// 2. POST: Add item to cart
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { movieId, quantity = 1 } = body;

    if (!movieId) {
      return NextResponse.json({ error: "movieId is required." }, { status: 400 });
    }

    // Check if movie exists
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });
    if (!movie) {
      return NextResponse.json({ error: "Movie not found." }, { status: 400 });
    }

    // Get or Create Cart
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id },
      });
    }

    // Add or Update CartItem
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_movieId: {
          cartId: cart.id,
          movieId: movieId,
        },
      },
    });

    if (existingItem) {
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
      return NextResponse.json(updatedItem);
    } else {
      const newItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          movieId: movieId,
          quantity: quantity,
        },
      });
      return NextResponse.json(newItem);
    }
  } catch (error) {
    console.error("POST /api/cart failed:", error);
    return NextResponse.json({ error: "Failed to add item to cart." }, { status: 500 });
  }
}

// 3. DELETE: Remove item from cart
export async function DELETE(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const cartItemId = searchParams.get("id");

    if (!cartItemId) {
      return NextResponse.json({ error: "id query parameter is required." }, { status: 400 });
    }

    // Verify item belongs to user's cart
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== session.user.id) {
      return NextResponse.json({ error: "Item not found or access denied." }, { status: 400 });
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return NextResponse.json({ ok: true, message: "Item removed from cart." });
  } catch (error) {
    console.error("DELETE /api/cart failed:", error);
    return NextResponse.json({ error: "Failed to delete item from cart." }, { status: 500 });
  }
}
