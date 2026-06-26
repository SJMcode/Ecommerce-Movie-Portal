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
 
const createMovieSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(40, "Title cannot be longer than 40 characters"),
  description: z
    .string()
    .max(500, "Content cannot be longer than 250 characters"),
  price: z
    .string()
    .min(1, "Price is required")
    .transform(Number)
    .refine((v) => !Number.isNaN(v), "Price must be a number")
    .refine((v) => v > 0, "Price must be greater than 0"),
  releaseDate: z
    .string()
    .transform(Number)
    .refine((v) => !isNaN(v), "Year must be a number")
    .refine(
      (v) => v > firstMovieYear,
      `No movie was released before ${firstMovieYear}`,
    )
    .refine(
      (v) => v < currentYear,
      `Release year cannot be greater than ${currentYear}`,
    ),
  imageUrl: z.string(),
  stock: z
    .string()
    .transform(Number)
    .refine((v) => v >= 0, "Stock cannot be less than zero"),
  runtime: z
    .string()
    .transform(Number)
    .refine(
      (v) => !isNaN(v) && v >= 0,
      "Runtime must be a number and cannot be a negative value",
    ),
  genres: z.array(z.string()).min(1, "Select at least one genre"),
  directors: z.array(z.string()).min(1, "Select at least one director"),
  cast: z.array(z.string())
});

export async function createMovie(
  values: InputAsStrings,
): Promise<CreateMovieResult> {

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
