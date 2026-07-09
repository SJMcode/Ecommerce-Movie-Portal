"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { createStripeSession } from "../_actions/stripe-checkout-action";

const formSchema = z.object({
  name: z.string().min(1, "Full name is required").max(50),
  email: z.string().email("Invalid email address"),
  shippingAddress: z.string().max(100),
});

type CartItem = {
  id: string;
  movieId: string;
  title: string;
  price: number;
  quantity: number;
  subtotal: number;
};

type CheckoutFormProps = {
  items: CartItem[];
  cartTotal: number;
  initialName: string;
  initialEmail: string;
};

export function CheckoutForm({ items, cartTotal, initialName, initialEmail }: CheckoutFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      name: initialName,
      email: initialEmail,
      shippingAddress: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const result = await createStripeSession(value.name, value.email);
        if (result.ok) {
          toast.success("Redirecting to secure Stripe Checkout...");
          // Redirect the user directly to the Stripe hosted payment page
          window.location.href = result.url;
        } else {
          toast.error(result.error);
        }
      } catch (error) {
        toast.error("An unexpected error occurred.");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      {/* Billing Info (Left) */}
      <div className="lg:col-span-7">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-zinc-100">
              Billing Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-6"
            >
              <form.Field name="name">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        placeholder="John Doe"
                        value={field.state.value}
                        onChange={(ev) => field.handleChange(ev.target.value)}
                        onBlur={field.handleBlur}
                        aria-invalid={isInvalid}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="email">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        placeholder="john@example.com"
                        value={field.state.value}
                        onChange={(ev) => field.handleChange(ev.target.value)}
                        onBlur={field.handleBlur}
                        aria-invalid={isInvalid}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="shippingAddress">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Shipping Address (Optional)</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        placeholder="123 Stockholm Road, Sweden"
                        value={field.state.value}
                        onChange={(ev) => field.handleChange(ev.target.value)}
                        onBlur={field.handleBlur}
                        aria-invalid={isInvalid}
                        className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <div className="pt-4 border-t border-zinc-800/40 text-xs text-zinc-400">
                <p>
                  🛡️ You will be redirected to a secure **Stripe** payment page. No credit card information is stored on our servers.
                </p>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-500 text-white rounded-full py-6 font-semibold transition disabled:cursor-not-allowed disabled:bg-zinc-800"
                >
                  {isSubmitting ? "Redirecting to Stripe..." : `Proceed to Payment: ${cartTotal.toFixed(2)} kr`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Order Summary (Right) */}
      <div className="lg:col-span-5">
        <Card className="border-zinc-800 bg-zinc-900/50 sticky top-24">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-zinc-100">
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="divide-y divide-zinc-800/60">
              {items.map((item) => (
                <div key={item.id} className="py-4 flex justify-between gap-4 first:pt-0">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-200 truncate">{item.title}</p>
                    <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-zinc-300 font-medium shrink-0">
                    {(item.price * item.quantity).toFixed(2)} kr
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800/60 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Subtotal</span>
                <span className="text-zinc-300">{cartTotal.toFixed(2)} kr</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Delivery</span>
                <span className="text-green-400 font-medium">Digital (Free)</span>
              </div>
            </div>

            <div className="border-t border-zinc-800/60 pt-4 flex justify-between items-baseline">
              <span className="text-base font-semibold text-zinc-100">Total</span>
              <span className="text-2xl font-bold text-red-400">{cartTotal.toFixed(2)} kr</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
