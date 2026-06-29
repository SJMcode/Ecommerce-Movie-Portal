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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "@tanstack/react-form";
import { Plus } from "lucide-react";
import z from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { createPerson } from "../_actions/edit-people-actions";
import { Textarea } from "@/components/ui/textarea";

type CreatePersonDialogProps = {
  onCreated?: (createPersonId: string) => Promise<void> | void;
};

const formSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be zero characters."),
  biography: z.string().trim(),
  imageUrl: z.string(),
  imdbId: z.string().trim(),
});

function CreatePersonDialog({ onCreated }: CreatePersonDialogProps) {
  const [open, setOpen] = useState(false); //Opens closes dialog window by changing useState value (boolean)
  const form = useForm({
    defaultValues: {
      name: "",
      biography: "",
      imageUrl: "",
      imdbId: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const newPerson = await createPerson(value);

      // Hard failure from server-side validation (e.g., duplicate imdbId).
      if (newPerson.ok === false) {
        return toast.error(newPerson.error);
      }

      // Soft duplicate-name case: ask user whether to force-create anyway.
      if (newPerson.ok === "duplicate-name") {
        const proceed = window.confirm(`${newPerson.error}. Continue anyway?`);
        if (!proceed) return;

        const forcedCreatePerson = await createPerson({
          ...value,
          forceCreate: true,
        });

        // Forced create can still fail (e.g., imdbId conflict); surface that error.
        if (forcedCreatePerson.ok !== true) {
          return toast.error(forcedCreatePerson.error);
        }

        setOpen(false);
        await onCreated?.(forcedCreatePerson.person.id);
        return toast.success("Successfully created person!");
      }

      setOpen(false);
      await onCreated?.(newPerson.person.id);
      toast.success("Successfully created person!");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}> {/* props here control open/closing of dialog window */}
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size={"sm"}>
          New person
          <Plus />
        </Button>
      </DialogTrigger>
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
              <DialogTitle className="mx-auto">Create new person</DialogTitle>
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

export { CreatePersonDialog };
