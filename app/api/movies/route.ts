import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /api/movies:
 *   get:
 *     summary: Get all movies
 *     description: Returns a list of all movies in the database catalog.
 *     tags:
 *       - Movies
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   price:
 *                     type: number
 *                   stock:
 *                     type: integer
 */
export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: { title: "asc" },
    });
    return NextResponse.json(movies);
  } catch (error: any) {
    console.error("GET /api/movies failed:", error);
    return NextResponse.json({ error: "Failed to fetch movies." }, { status: 500 });
  }
}
