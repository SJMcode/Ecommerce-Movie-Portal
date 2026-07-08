import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SuccessClient } from "./_components/success-client";

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
    orderId?: string;
  }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;
  const orderId = params.orderId;

  if (!sessionId || !orderId) {
    redirect("/");
  }

  // Fetch order total for display
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      totalAmount: true,
    },
  });

  if (!order) {
    redirect("/");
  }

  const amount = Number(order.totalAmount);

  return (
    <main className="px-6 min-h-[85vh] flex items-center justify-center">
      <section className="max-w-md w-full py-12">
        <SuccessClient sessionId={sessionId} orderId={orderId} amount={amount} />
      </section>
    </main>
  );
}
