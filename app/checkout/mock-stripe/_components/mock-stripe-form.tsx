"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { finalizeOrder } from "../../_actions/finalize-order-action";

const stripeFormSchema = z.object({
  cardName: z.string().min(1, "Name on card is required").max(50),
  cardNumber: z.string().regex(/^\d{16}$/, "Card number must be exactly 16 digits"),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, "Expiry must be MM/YY"),
  cardCvc: z.string().regex(/^\d{3,4}$/, "CVC must be 3 or 4 digits"),
});

type MockStripeFormProps = {
  sessionId: string;
  orderId: string;
  amount: number;
};

export function MockStripeForm({ sessionId, orderId, amount }: MockStripeFormProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm({
    defaultValues: {
      cardName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
    },
    validators: {
      onSubmit: stripeFormSchema,
    },
    onSubmit: async () => {
      setIsProcessing(true);
      
      try {
        const res = await finalizeOrder(orderId, sessionId);
        if (!res.ok) {
          setIsProcessing(false);
          toast.error(res.error || "Payment authorization failed.");
          return;
        }

        toast.success("Secure payment authorized!");
        router.push(`/checkout/success?session_id=${sessionId}&orderId=${orderId}`);
        router.refresh();
      } catch (error) {
        setIsProcessing(false);
        toast.error("Failed to authorize payment.");
      }
    },
  });

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <h3 className="text-sm font-semibold text-zinc-300">Pay with Credit Card</h3>

      <form.Field name="cardName">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Name on Card</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="Jane Doe"
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

      <form.Field name="cardNumber">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Card Number</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                placeholder="4242 4242 4242 4242"
                maxLength={16}
                value={field.state.value}
                onChange={(ev) => field.handleChange(ev.target.value.replace(/\D/g, ''))}
                onBlur={field.handleBlur}
                aria-invalid={isInvalid}
                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 font-mono tracking-widest"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="cardExpiry">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Expiration Date</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="MM/YY"
                  maxLength={5}
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 font-mono"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Field name="cardCvc">
          {(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>CVC</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="123"
                  maxLength={4}
                  value={field.state.value}
                  onChange={(ev) => field.handleChange(ev.target.value.replace(/\D/g, ''))}
                  onBlur={field.handleBlur}
                  aria-invalid={isInvalid}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 font-mono"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-full py-6 font-semibold transition disabled:cursor-not-allowed disabled:bg-zinc-800"
        >
          {isProcessing ? "Authorizing Payment on stripe-mock..." : `Pay ${amount.toFixed(2)} kr`}
        </Button>
      </div>
    </form>
  );
}
