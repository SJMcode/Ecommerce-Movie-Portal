"use server";

import { prisma } from "@/lib/prisma";

import z from "zod";


// ------------------------------ GET GENRE FUNCTION 

export async function getGenres() {
  const genres = prisma.genre.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });
  return genres;
}

// ------------------------------ DELETE GENRE FUNCTION

export async function deleteGenreById(genreId: string) {
  const deleted = await prisma.genre.delete({
    where: {
      id: genreId
    }
  })

  return deleted;
}

// ------------------------------ CREATE GENRE FUNCTION

type GenreString = {
  name: string;
};

type CreateGenreResult =
  | { ok: true; genre: { id: string } }
  | { ok: false; error: string };

const createGenreSchema = z.object({
  name: z
    .string().trim().min(1, "Genre name cannot be zero characters."),
});



export async function createGenre(values: GenreString): Promise<CreateGenreResult> {


  const data = createGenreSchema.parse(values);
  
    const checkForDuplicate = await prisma.genre.findFirst({
      where: {
        name: { equals: data.name, mode: "insensitive" }
        },
    });
  
    if (checkForDuplicate) {
      return { ok: false, error: "The genre already exists in the database" };
    }
  
    const newGenre = await prisma.genre.create({
      data: {
        name: data.name
      },
    });
  
    return { ok: true, genre: { id: newGenre.id } };
}
