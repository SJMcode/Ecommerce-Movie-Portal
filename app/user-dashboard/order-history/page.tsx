import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OrdersTable } from "./_components/orders-tables";

export default async function OrderHistoryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col gap-10 mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-red-400 font-semibold">Order History</h1>
        <h1 className="text-2xl md:text-4xl font-semibold">Your Orders</h1>
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Track your past and active orders.</p>
        </div>
      </div>
      <div className="h-px bg-accent/70" />

      <OrdersTable userId={session.user.id} />

      <h1 className="text-2xl md:text-4xl font-semibold">
        Datafields are connected to DB tables Order - User, so they should
        populate correctly. Needs a connection to cart/order create flow and
        should populate user.
      </h1>
    </div>
  );
}
