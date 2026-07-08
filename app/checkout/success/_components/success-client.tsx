"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { finalizeOrder } from "../../_actions/finalize-order-action";

type SuccessClientProps = {
  sessionId: string;
  orderId: string;
  amount: number;
};

export function SuccessClient({ sessionId, orderId, amount }: SuccessClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let active = true;

    async function verify() {
      try {
        const result = await finalizeOrder(orderId, sessionId);
        if (!active) return;

        if (result.ok) {
          setStatus("success");
          // Refresh router state to update cart icon count
          router.refresh();
        } else {
          setStatus("error");
          setErrorMsg(result.error);
        }
      } catch (err: any) {
        if (!active) return;
        setStatus("error");
        setErrorMsg("Failed to communicate with payment server.");
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, [sessionId, orderId, router]);

  if (status === "verifying") {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50 text-center p-8 space-y-6">
        <div className="flex justify-center">
          <Loader2 className="h-12 w-12 text-indigo-400 animate-spin" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl font-bold text-white">Verifying Payment</CardTitle>
          <p className="text-sm text-zinc-400">
            Securing transaction... Checking verification status with Stripe.
          </p>
        </div>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50 text-center p-8 space-y-6">
        <div className="flex justify-center text-red-500">
          <AlertTriangle className="h-12 w-12" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl font-bold text-red-500 font-semibold">Verification Failed</CardTitle>
          <p className="text-sm text-zinc-400">
            {errorMsg || "We were unable to confirm this payment session."}
          </p>
        </div>
        <div className="pt-4 flex flex-col gap-3">
          <Link
            href="/checkout"
            className="w-full rounded-full bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 py-3 text-sm font-semibold transition"
          >
            Return to Checkout
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 text-center p-8 space-y-6">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-400 ring-2 ring-green-500/20">
          <CheckCircle className="h-10 w-10" />
        </div>
      </div>

      <div className="space-y-2">
        <CardTitle className="text-2xl font-bold text-white">Payment Successful!</CardTitle>
        <p className="text-sm text-zinc-400">
          Thank you for your purchase. Your order has been placed successfully.
        </p>
      </div>

      <div className="border-t border-zinc-800/60 pt-6 space-y-3">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Order ID</span>
          <span className="text-zinc-300 font-mono">{orderId}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Amount Paid</span>
          <span className="text-red-400 font-bold">
            {amount.toFixed(2)} kr
          </span>
        </div>
      </div>

      <div className="pt-4 flex flex-col gap-3">
        <Link
          href="/user-dashboard/order-history"
          className="w-full rounded-full bg-red-600 hover:bg-red-500 text-white py-3 text-sm font-semibold transition"
        >
          View Order History
        </Link>
        <Link
          href="/movies"
          className="w-full rounded-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 py-3 text-sm font-semibold transition"
        >
          Continue Browsing
        </Link>
      </div>
    </Card>
  );
}
