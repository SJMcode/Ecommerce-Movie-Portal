"use server";

import { prisma } from "@/lib/prisma";
import z from "zod";

// ------------------------------ GET PEOPLE FUNCTION
export type PersonAllDetails = {
  id: string;
  name: string;
  biography: string | null;
  imageUrl: string | null;
  imdbId: string | null;
  updatedAt: Date;
};

export async function getPeople() {
  const people = prisma.person.findMany({
    select: {
      id: true,
      name: true,
      biography: true,
      imageUrl: true,
      imdbId: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });
  return people;
}

// ------------------------------ GET PERSON FUNCTION

export async function getPersonById(personId: string) {
  const person = await prisma.person.findUnique({
    select: {
      id: true,
      name: true,
      biography: true,
      imageUrl: true,
      imdbId: true,
    },
    where: {
      id: personId,
    },
  });

  return person;
}

// ------------------------------ DELETE PERSON FUNCTION

export async function deletePersonById(personId: string) {
  const deleted = await prisma.person.delete({
    where: {
      id: personId,
    },
  });

  return deleted;
}

// ------------------------------ CREATE PERSON FUNCTION

type UpdatePersonInput = {
  id: string;
  name: string;
  biography?: string | null;
  imageUrl?: string | null;
  imdbId?: string | null;
};

// If biography, imageUrl or imdbId are empty strings, they are transformed into undefined -> in DB this resolves to NULL (since they are nullable in schema)
const updatePersonSchema = z.object({
  id: z.string().trim().min(1, "Person id is required"),
  name: z.string().trim().min(1, "Name cannot be zero characters."),
  biography: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? null : value)),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? null : value)),
  imdbId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? null : value)),
});

type UpdatePersonResult =
  | { ok: true; person: { id: string } } // if no match is found, clientside receives ok: true and the person id
  | { ok: false; error: string }; // if imdbId is found in db -> does not create and sends back error message (hard block)

export async function updatePerson(
  values: UpdatePersonInput,
): Promise<UpdatePersonResult> {
  const data = updatePersonSchema.parse(values);

  if (data.imdbId) {
    const existingByImdb = await prisma.person.findFirst({
      where: { 
        imdbId: data.imdbId,
        id: { not: data.id } },
        select: { id: true },
    });

    if (existingByImdb) {
      return {
        ok: false,
        error: "A person with that imdbId already exists in the database",
      };
    }
  }

  try {
    const updated = await prisma.person.update({
      where: { id: data.id },
      data: {
        name: data.name,
        biography: data.biography ?? null,
        imageUrl: data.imageUrl ?? null,
        imdbId: data.imdbId ?? null,
      },
      select: { id: true },
    })
    
    return { ok: true, person: { id: updated.id}}
  } catch {
    return { ok: false, error: "Person not found or could not be updated" }
  }
}
