"use server";

import { prisma } from "@/lib/prisma";
import z from "zod";

// ------------------------------ GET PEOPLE FUNCTION
export type PeopleOption = {
  id: string;
  name: string;
  biography: string | null;
  imageUrl: string | null;
  imdbId: string | null;
};

export async function getPeople() {
  const people = prisma.person.findMany({
    select: {
      id: true,
      name: true,
      biography: true,
      imageUrl: true,
      imdbId: true,
    },
    orderBy: { name: "asc" },
  });
  return people;
}

// ------------------------------ DELETE PERSON FUNCTION

export async function deletePersonById(personId: string) {
  const deleted = await prisma.person.delete({
    where: {
      id: personId
    }
  })

  return deleted;
}

// ------------------------------ CREATE PERSON FUNCTION

type PersonString = {
  name: string;
  biography?: string;
  imageUrl?: string;
  imdbId?: string;
  forceCreate?: boolean;
};

// If biography, imageUrl or imdbId are empty strings, they are transformed into undefined -> in DB this resolves to NULL (since they are nullable in schema)
const createPersonSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be zero characters."),
  biography: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  imdbId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  forceCreate: z.boolean().optional(),
});

type CreatePersonResult =
  | { ok: true; person: { id: string } } // if no match is found, clientside receives ok: true and the person id
  | { ok: "duplicate-name"; error: string } // if the same name is found in db -> alert user to confirm create on clientside (soft block) and await response before creating/aborting
  | { ok: false; error: string }; // if imdbId is found in db -> does not create and sends back error message (hard block)

export async function createPerson(
  values: PersonString,
): Promise<CreatePersonResult> {
  const data = createPersonSchema.parse(values);

  const imdbId = data.imdbId?.trim() || undefined;

  // This create flow uses two server calls for duplicate names: 
  // - the first call checks for conflicts and returns ok: "duplicate-name" 
  //   when a same-name person exists (and no imdbId conflict). 
  // - The client then asks the user to confirm. 
  // - If they agree, it sends a second call with forceCreate: true, 
  //   which skips the duplicate-name guard and proceeds to create the person. 
  // - imdbId duplicates remain a hard block in both cases.

  // hard block by imdbId
  if (imdbId) {
    const existingByImdb = await prisma.person.findFirst({
      where: { imdbId },
    });

    if (existingByImdb) {
      return {
        ok: false,
        error: "A person with that imdbId already exists in the database",
      };
    }
  }

  // soft block by name only when user has not confirmed override
  if (!data.forceCreate) {
    const existingByName = await prisma.person.findFirst({
      where: { name: { equals: data.name, mode: "insensitive" } },
    });

    if (existingByName && !imdbId) {
      return {
        ok: "duplicate-name",
        error: "A person with that name already exists in the database",
      };
    }
  }

  const newPerson = await prisma.person.create({
    data: {
      name: data.name,
      biography: data.biography,
      imageUrl: data.imageUrl,
      imdbId: imdbId,
    },
  });

  return { ok: true, person: { id: newPerson.id } };
}
