"use server";

import { prisma } from "@/lib/prisma";
import z from "zod";

type InputAsStrings = {
  title: string;
  description: string;
  price: string;
  releaseDate: string;
  imageUrl: string;
  stock: string;
  runtime: string;
  genres: string[];
  directors: string[];
  cast: string[];
};

type CreateMovieResult =
  | { ok: true; movie: { id: string } }
  | { ok: false; error: string };

const currentYear = new Date().getFullYear();
const firstMovieYear = 1888;


// Look into using this for numbers when time: 
// ----> z.coerce.number<number>()
 
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const createMovieSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(40, "Title cannot be longer than 40 characters"),
  description: z
    .string()
    .max(500, "Content cannot be longer than 250 characters"),
  price: z.coerce.number().gt(0, "Price must be greater than 0"),
  releaseDate: z.coerce
      .number()
      .int("Year must be a whole number")
      .gt(firstMovieYear, `No movie was released before ${firstMovieYear}`)
      .lt(currentYear, `Release year cannot be greater than ${currentYear}`),
  imageUrl: z.string(),
  stock: z.coerce.number().int().min(0, "Stock cannot be less than zero"),
  runtime: z.coerce.number().int().min(0, "Runtime cannot be negative"),
  genres: z.array(z.string()).min(1, "Select at least one genre"),
  directors: z.array(z.string()).min(1, "Select at least one director"),
  cast: z.array(z.string())
});

export async function createMovie(
  values: InputAsStrings,
): Promise<CreateMovieResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, error: "Unauthorized" };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== "admin") {
    return { ok: false, error: "Forbidden: Admins only" };
  }

  const data = createMovieSchema.parse(values);

  const checkForDuplicate = await prisma.movie.findUnique({
    where: {
      title_releaseDate: {
        title: data.title,
        releaseDate: data.releaseDate,
      },
    },
  });

  if (checkForDuplicate) {
    return { ok: false, error: "The movie already exists in the database" };
  }

  const newMovie = await prisma.movie.create({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      releaseDate: data.releaseDate,
      imageUrl: data.imageUrl,
      stock: data.stock,
      runtime: data.runtime,
      authorId: session.user.id,
      genres: {
        createMany: {
          data: data.genres.map((genreId) => ({
            genreId: genreId,
          })),
        },
      },
      directors: {
        createMany: {
          data: data.directors.map((personId) => ({
            personId: personId
          }))
        }
      },
      cast: {
        createMany: {
          data: data.cast.map((personId) => ({
            personId: personId
          }))
        }
      }

    },
  });

  return { ok: true, movie: { id: newMovie.id } };
}
