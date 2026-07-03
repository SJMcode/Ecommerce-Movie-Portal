"use client";

import * as React from "react";
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
import z from "zod";
import { toast } from "sonner";
import { updateProfile } from "../_actions/update-profile-action";
import { useRouter } from "next/navigation";
import { Edit2 } from "lucide-react";

const formSchema = z.object({
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

type EditProfileProps = {
  user: {
    name: string;
    image: string | null;
  };
};

export function EditProfileDialog({ user }: EditProfileProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      name: user.name,
      image: user.image || "",
    },
    validators: {
      onChange: formSchema,
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const res = await updateProfile({
        name: value.name,
        image: value.image || null,
      });

      if (!res.ok) {
        return toast.error(res.error || "Failed to update profile");
      }

      toast.success("Profile successfully updated!");
      setOpen(false);
      router.refresh();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white rounded-xl transition">
          <Edit2 className="h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogPortal>
        <DialogContent className="sm:max-w-md bg-zinc-950 border border-zinc-800 text-white">
          <form
            method="POST"
            onSubmit={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              form.handleSubmit(ev);
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Profile Details</DialogTitle>
            </DialogHeader>

            <form.Field name="name">
              {(field) => (
                <Field className="py-1">
                  <Label htmlFor={field.name} className="text-zinc-300">Full Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(ev) => field.handleChange(ev.target.value)}
                    onBlur={field.handleBlur}
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                  {field.state.meta.errors && (
                    <p className="text-xs text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field name="image">
              {(field) => (
                <Field className="py-1">
                  <Label htmlFor={field.name} className="text-zinc-300">Avatar Image URL</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(ev) => field.handleChange(ev.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="https://example.com/avatar.png"
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                  {field.state.meta.errors && (
                    <p className="text-xs text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            <DialogFooter className="py-2 gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-zinc-800 hover:bg-zinc-900 text-zinc-300">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="bg-red-600 hover:bg-red-500 text-white">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
