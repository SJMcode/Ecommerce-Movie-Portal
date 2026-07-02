"use server";

import { prisma } from "@/lib/prisma";
import z from "zod";

type EditMovieInput = { id: string } & z.input<typeof editMovieSchema>;

// Return type that goes back to clientside with
// - the id of the movie in case that is needed
// - and a boolean letting the client know if edit was successful
type EditMovieResult =
  | { ok: true; movie: { id: string } }
  | { ok: false; error: string };

const currentYear = new Date().getFullYear();
const firstMovieYear = 1888;

// Look into using this for numbers when time:
// ----> z.coerce.number<number>()

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const editMovieSchema = z.object({
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
  genres: z.array(z.string()),
  directors: z.array(z.string()),
  cast: z.array(z.string()),
});

async function editMovie(values: EditMovieInput): Promise<EditMovieResult> {
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

  const data = editMovieSchema.parse(values);

  const checkForDuplicate = await prisma.movie.findFirst({
    where: {
      title: data.title,
      releaseDate: data.releaseDate,
      NOT: { id: values.id },
    },
  });

  if (checkForDuplicate) {
    return { ok: false, error: "The movie already exists in the database" };
  }

  const updatedMovie = await prisma.movie.update({
    data: {
      title: data.title,
      description: data.description,
      price: data.price,
      releaseDate: data.releaseDate,
      imageUrl: data.imageUrl,
      stock: data.stock,
      runtime: data.runtime,
      genres: {
        deleteMany: {},
        createMany: {
          data: data.genres.map((genreId) => ({
            genreId: genreId,
          })),
          skipDuplicates: true,
        },
      },
      directors: {
        deleteMany: {},
        createMany: {
          data: data.directors.map((personId) => ({
            personId: personId,
          })),
          skipDuplicates: true,
        },
      },
      cast: {
        deleteMany: {},
        createMany: {
          data: data.cast.map((personId) => ({
            personId: personId,
          })),
          skipDuplicates: true,
        },
      },
    },
    where: {
      id: values.id,
    },
  });

  return { ok: true, movie: { id: updatedMovie.id } };
}

export { editMovie };
