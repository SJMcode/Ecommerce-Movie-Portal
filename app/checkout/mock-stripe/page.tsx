import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MockStripeForm } from "./_components/mock-stripe-form";
import { Card, CardContent } from "@/components/ui/card";

type MockStripePageProps = {
  searchParams: Promise<{
    session_id?: string;
    orderId?: string;
    email?: string;
  }>;
};

export default async function MockStripePage({ searchParams }: MockStripePageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;
  const orderId = params.orderId;
  const email = params.email || "";

  if (!sessionId || !orderId) {
    redirect("/checkout");
  }

  // Fetch order total for display
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      totalAmount: true,
    },
  });

  if (!order) {
    redirect("/checkout");
  }

  const amount = Number(order.totalAmount);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-12 gap-8 items-start">
        {/* Left Side: Mock Stripe Branding & Summary */}
        <div className="md:col-span-5 space-y-6 pt-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-indigo-400">stripe</span>
            <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              Test Mode
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-zinc-400 font-medium">Pay Lonely Rider Team</p>
            <p className="text-4xl font-extrabold text-white">{amount.toFixed(2)} kr</p>
          </div>

          <div className="space-y-4 text-sm text-zinc-400">
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span>Customer</span>
              <span className="text-zinc-200 truncate max-w-[200px]">{email}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span>Order Ref</span>
              <span className="text-zinc-200 font-mono text-xs">{orderId}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs leading-relaxed text-yellow-300/80">
            ⚠️ **Simulated Sandbox Gateway**
            <br />
            This is a mock payment gateway. Do not enter real credit card numbers. You can use **4242 4242 4242 4242** with any future date.
          </div>
        </div>

        {/* Right Side: Credit Card Form */}
        <div className="md:col-span-7">
          <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur">
            <CardContent className="pt-6">
              <MockStripeForm sessionId={sessionId} orderId={orderId} amount={amount} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
