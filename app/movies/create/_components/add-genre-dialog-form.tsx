"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "@tanstack/react-form";
import { Plus } from "lucide-react";
import z from "zod";
import { createGenre } from "../_actions/genre-actions";
import { toast } from "sonner";
import router from "next/router";
import { useState } from "react";

type AddGenreDialogProps = {
  onCreated?: (createGenreId: string) => Promise<void> | void;
}

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Genre name cannot be zero characters.")
    .max(50, "Genre name cannot be longer than 50 characters"),
});

function AddGenreDialog({ onCreated }: AddGenreDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    defaultValues: {
      name: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const newGenre = await createGenre(value);

      if (newGenre.ok === false) {
        return toast.error(newGenre.error);
      }

      setOpen(false);
      await onCreated?.(newGenre.genre.id);
      toast.success("Successfully added genre!");
    },
  });

  return (
    // Check DialogPortal ; wrap dialogcontent ?
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Create new genre
          <Plus />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <form
          method="POST"
          onSubmit={(ev) => {
            ev.preventDefault();
            form.handleSubmit(ev);
          }}
        >
          <DialogHeader>
            <DialogTitle className="mx-auto">Create new genre</DialogTitle>
          </DialogHeader>

          <form.Field name="name">
            {(field) => (
              <Field className="py-2">
                <Label htmlFor={field.name}>Genre Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                />
              </Field>
            )}
          </form.Field>

          <DialogFooter className="py-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { AddGenreDialog };
