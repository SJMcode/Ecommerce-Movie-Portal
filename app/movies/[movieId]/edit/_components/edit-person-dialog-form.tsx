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
import { toast } from "sonner";

import { Textarea } from "@/components/ui/textarea";
import { updatePerson } from "../_actions/edit-people-actions";

type EditPersonDialogProps = {
  person: {
    id: string;
    name: string;
    biography: string | null;
    imageUrl: string | null;
    imdbId: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (updatedPersonId: string) => Promise<void> | void;
};

const formSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be zero characters."),
  biography: z.string().trim(),
  imageUrl: z.string(),
  imdbId: z.string().trim(),
});

function EditPersonDialogForm({
  person,
  open,
  onOpenChange,
  onUpdated,
}: EditPersonDialogProps) {
  const form = useForm({
    defaultValues: {
      name: person.name,
      biography: person.biography ?? "",
      imageUrl: person.imageUrl ?? "",
      imdbId: person.imdbId ?? "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const updatedPerson = await updatePerson({
        id: person.id,
        name: value.name,
        biography: value.biography,
        imageUrl: value.imageUrl,
        imdbId: value.imdbId,
      });

      // Hard failure from server-side validation (e.g., duplicate imdbId).
      if (updatedPerson.ok === false) {
        return toast.error(updatedPerson.error);
      }

      onOpenChange(false);
      await onUpdated?.(updatedPerson.person.id);
      toast.success("Successfully updated person details!");
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
              <DialogTitle className="mx-auto">Edit person</DialogTitle>
            </DialogHeader>

            <form.Field name="name">
              {(field) => (
                <Field className="py-2">
                  <Label htmlFor={field.name}>Name</Label>
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

            <form.Field name="biography">
              {(field) => (
                <Field className="py-2">
                  <Label htmlFor={field.name}>Short Bio</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    rows={4}
                    wrap="soft"
                    style={{ fieldSizing: "fixed" }}
                    className=""
                    value={field.state.value}
                    onChange={(ev) => field.handleChange(ev.target.value)}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="imageUrl">
              {(field) => (
                <Field className="py-2">
                  <Label htmlFor={field.name}>Image Url</Label>
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

            <form.Field name="imdbId">
              {(field) => (
                <Field className="py-2">
                  <Label htmlFor={field.name}>IMDB ID</Label>
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

export { EditPersonDialogForm };
