"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "@tanstack/react-form";
import z from "zod";
import { editGenre } from "../_actions/edit-genre-actions";
import { toast } from "sonner";

/*
This component should be hooked into a button in the genre search field. 

-- Implementation: 
When looking at the genre dropdown list (both in create movie page, and edit movie page), for each listed item
there should be an edit button sitting to the far right of the listed item. 
When clicked, should open up a dialog window to edit the name of the genre.
*/

type EditGenreDialogProps = {
  genre: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (updatedGenreId: string) => Promise<void> | void;
};

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Genre name cannot be zero characters.")
    .max(50, "Genre name cannot be longer than 50 characters"),
});

// function EditGenreDialogForm({ onCreated }: EditGenreDialogProps) {
function EditGenreDialogForm({
  genre,
  open,
  onOpenChange,
  onUpdated,
}: EditGenreDialogProps) {
  const form = useForm({
    defaultValues: {
      name: genre.name,
    },
    validators: {
      onChange: formSchema,
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const updatedGenre = await editGenre({ id: genre.id, name: value.name });

      if (updatedGenre.ok === false) {
        return toast.error(updatedGenre.error);
      }

      onOpenChange(false);
      await onUpdated?.(updatedGenre.genre.id);
      toast.success("Genre successfully updated!");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogContent className="sm:max-w-sm">
          <form
            method="POST"
            onSubmit={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              form.handleSubmit(ev);
            }}
          >
            <DialogHeader>
              <DialogTitle className="mx-auto">Edit genre</DialogTitle>
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
      </DialogPortal>
    </Dialog>
  );
}

export { EditGenreDialogForm };
