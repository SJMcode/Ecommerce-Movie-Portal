"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import z from "zod";

const currentYear = new Date().getFullYear();
const firstMovieYear = 1888;

type InputAsStrings = {
  title: string;
  description: string;
  price: string;
  releaseDate: string;
  imageUrl: string;
  stock: string;
  runtime: string;
};

const createMovieSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(40, "Title cannot be longer than 40 characters"),
  description: z
    .string()
    .max(250, "Content cannot be longer than 250 characters"),
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
});

type CreateMovieResult =
  | { ok: true; movie: { id: string } }
  | { ok: false; error: string };

export async function createMovie(
  values: InputAsStrings,
): Promise<CreateMovieResult> {

  // ------------------UNCOMMENT TO ENABLE BETTER AUTH
  // const session = await auth.api.getSession({
  //     headers: await headers(),
  // });

  // if (!session) {
  //     redirect("/sign-in")
  // }

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
    },
  });

  return { ok: true, movie: { id: newMovie.id } };
}
