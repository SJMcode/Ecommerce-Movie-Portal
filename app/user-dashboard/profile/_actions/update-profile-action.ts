"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import z from "zod";

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name cannot be longer than 50 characters"),
  image: z
    .string()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .nullable()
    .optional(),
});

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export async function updateProfile(values: UpdateProfileInput) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const data = updateProfileSchema.parse(values);

    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: data.name,
        image: data.image || null,
      },
    });

    return { ok: true, user: { id: updatedUser.id, name: updatedUser.name } };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: error.errors[0].message };
    }
    return { ok: false, error: error.message || "Failed to update profile" };
  }
}
