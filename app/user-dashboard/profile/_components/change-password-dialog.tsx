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
import { authClient } from "@/lib/auth-client";
import { Lock, Eye, EyeOff } from "lucide-react";

const formSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string().min(8, "Confirm new password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

export function ChangePasswordDialog() {
  const [open, setOpen] = React.useState(false);
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    validators: {
      onChange: formSchema,
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const { error } = await authClient.changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
          revokeOtherSessions: true,
        });

        if (error) {
          toast.error(error.message || "Failed to update password");
          return;
        }

        toast.success("Password successfully updated!");
        setOpen(false);
        form.reset();
      } catch (err: any) {
        toast.error("An unexpected error occurred.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded-xl transition">
          <Lock className="h-4 w-4" />
          Change Password
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
              <DialogTitle className="text-xl font-bold">Change Password</DialogTitle>
            </DialogHeader>

            <form.Field name="currentPassword">
              {(field) => (
                <Field className="py-1">
                  <Label htmlFor={field.name} className="text-zinc-300">Current Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(ev) => field.handleChange(ev.target.value)}
                      onBlur={field.handleBlur}
                      type={showCurrent ? "text" : "password"}
                      className="bg-zinc-900 border-zinc-800 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-200 transition"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {field.state.meta.errors && (
                    <p className="text-xs text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field name="newPassword">
              {(field) => (
                <Field className="py-1">
                  <Label htmlFor={field.name} className="text-zinc-300">New Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(ev) => field.handleChange(ev.target.value)}
                      onBlur={field.handleBlur}
                      type={showNew ? "text" : "password"}
                      className="bg-zinc-900 border-zinc-800 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-200 transition"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {field.state.meta.errors && (
                    <p className="text-xs text-red-500 mt-1">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field name="confirmNewPassword">
              {(field) => (
                <Field className="py-1">
                  <Label htmlFor={field.name} className="text-zinc-300">Confirm New Password</Label>
                  <div className="relative mt-1">
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onChange={(ev) => field.handleChange(ev.target.value)}
                      onBlur={field.handleBlur}
                      type={showConfirm ? "text" : "password"}
                      className="bg-zinc-900 border-zinc-800 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-200 transition"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
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
              <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-500 text-white disabled:bg-zinc-800">
                {isSubmitting ? "Saving..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
