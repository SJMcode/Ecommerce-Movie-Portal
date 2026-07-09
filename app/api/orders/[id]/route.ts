import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Retrieve Order Details
 *     description: Returns items, prices, and status for a specific order. Requires user authentication.
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique Order ID
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized (please sign in)
 *       403:
 *         description: Forbidden (you do not own this order)
 *       404:
 *         description: Order not found
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            movie: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Security check: Check if user owns this order, or is an admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (order.userId !== session.user.id && user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. You do not own this order." }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("GET /api/orders/[id] failed:", error);
    return NextResponse.json({ error: "Failed to fetch order details." }, { status: 500 });
  }
}
