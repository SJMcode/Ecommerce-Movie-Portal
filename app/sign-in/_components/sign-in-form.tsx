"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { useForm } from "@tanstack/react-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { z } from "zod"

const formSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  rememberMe: z.boolean(),
})

function SignInForm() {
  const router = useRouter()

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      const result = await authClient.signIn.email({
        email: value.email,
        password: value.password,
        rememberMe: value.rememberMe,
      })

      if (result.error) {
        toast.error(result.error.message ?? "Failed to sign in.")
        return
      }

      toast.success("Successfully signed in!")
      router.push("/")
      router.refresh()
    },
  })

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault()
        form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field name="email">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  type="email"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        <form.Field name="password">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  type="password"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        <form.Field name="rememberMe">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid} orientation="horizontal">
                <Checkbox
                  id={field.name}
                  name={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) => {
                    if (checked === "indeterminate") {
                      return
                    }
                    field.handleChange(checked)
                  }}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                />
                <FieldLabel htmlFor={field.name}>Remember Me</FieldLabel>
              </Field>
            )
          }}
        </form.Field>

        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Field orientation="horizontal">
              <Button type="submit" disabled={isSubmitting}>
                Sign In
              </Button>
            </Field>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  )
}

export { SignInForm }
