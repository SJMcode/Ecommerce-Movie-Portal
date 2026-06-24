"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";
import { createMovie } from "../_actions/movie-action";

// ---------------------- To be added later:
// Look into multiple select component for genres: https://shadcn-multi-select-component.vercel.app/
// For adding PEOPLE to movie:
// - have a field where user can fill in a name and also get
//   search suggestions from the DB.
// - Add checkboxes next to the search field for role in movie: Director / Actor

// Both will be validated by ZOD as strings.

// Validation form model/schema

const currentYear = new Date().getFullYear();
const firstMovieYear = 1888;

const formSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(40, "Title cannot be longer than 40 characters"),
  description: z
    .string()
    .max(5000, "Content cannot be longer than 250 characters"),
  price: z
    .string()
    .min(1, "Price is required")
    .transform(Number) // DOUBLE CHECK THIS FOR ALL NUMBER FIELDS; DOES IT MESS UP THE STATE FIELD?
    .refine((v) => !isNaN(v), "Price must be a number")
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

function CreateMovieForm() {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      price: "",
      releaseDate: "",
      imageUrl: "",
      stock: "", // default in prisma schema is set to 50
      runtime: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const newMovie = await createMovie(value);

      if (newMovie.ok === false) {
        toast.error(newMovie.error);
        return;
      }

      toast.success("Successfully added movie!");
      router.push(`/movies/${newMovie.movie.id}`);
    },
  });

  return (
    <form
      method="POST"
      onSubmit={(ev) => {
        ev.preventDefault();
        form.handleSubmit(ev);
      }}
    >
      <FieldGroup>
        <form.Field name="title">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="description">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="price">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Price</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="releaseDate">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Release year</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="imageUrl">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Image URL</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="stock">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>In stock</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="runtime">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Runtime in minutes</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <Field orientation="horizontal">
          <Button type="submit">Create Movie</Button>
        </Field>
      </FieldGroup>
    </form>
  );
}

export { CreateMovieForm };
