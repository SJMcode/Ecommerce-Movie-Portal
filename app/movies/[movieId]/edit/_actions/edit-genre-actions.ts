"use server";

import { prisma } from "@/lib/prisma";

import z from "zod";


// ------------------------------ GET GENRES FUNCTION 

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

// ------------------------------ GET GENRE BY ID FUNCTION 

export async function getGenreById(genreId: string): Promise<{ id: string; name: string; } | null> {
  const genre = prisma.genre.findUnique({
    select: {
      id: true,
      name: true,
    },
    where: {
      id: genreId
    },
  });
  return genre;
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

// -------------------------------- UPDATE GENRE FUNCTION

type EditGenreResult =
  | { ok: true; genre: { id: string } }
  | { ok: false; error: string };

    const editGenreSchema = z.object({
  id: z.string(),
  name: z
    .string().trim().min(1, "Genre name cannot be zero characters."),
});

export async function editGenre(values: z.infer<typeof editGenreSchema>): Promise<EditGenreResult> {

  const data = editGenreSchema.parse(values);
  
    const checkForDuplicate = await prisma.genre.findFirst({
      where: {
        name: { equals: data.name, mode: "insensitive" }
        },
    });
  
    if (checkForDuplicate) {
      return { ok: false, error: "The genre name already exists in the database" };
    }
  
    const updatedGenre = await prisma.genre.update({
      data: {
        name: data.name
      },
      where: {
        id: data.id
      }
    });
  
    return { ok: true, genre: { id: updatedGenre.id } };
}

