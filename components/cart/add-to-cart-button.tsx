"use client";

import { useTransition } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { addMovieToCart } from "@/app/cart/_actions/add-to-cart-action";

// client button
// this runs in the browser and shows toast feedback

type AddToCartButtonProps = {
  movieId: string;
  className?: string;
  children?: ReactNode;
};

export function AddToCartButton({
  movieId,
  className,
  children = "Add to cart",
}: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleAddToCart() {
    startTransition(async () => {
      const result = await addMovieToCart(movieId);

      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleAddToCart}
      className={className}
    >
      {isPending ? "Adding..." : children}
    </button>
  );
}