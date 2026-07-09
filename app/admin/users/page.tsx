import React from "react";
import { prisma } from "@/lib/prisma";
import { UserDrawer } from "../_components/user-drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Eye } from "lucide-react";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.search || "";

  // 1. Fetch Users matching search filters
  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      orders: {
        orderBy: { orderDate: "desc" },
      },
      cart: {
        include: {
          items: {
            include: {
              movie: {
                select: {
                  title: true,
                  price: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer CRM</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Monitor registration trends, track user lifetime value, and moderate accounts.
          </p>
        </div>

        {/* Server-Side Search Form */}
        <form method="GET" action="/admin/users" className="flex items-center gap-2 max-w-xs w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              name="search"
              placeholder="Search name or email..."
              className="pl-9 h-9 text-xs bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-red-500"
              defaultValue={search}
            />
          </div>
          <Button type="submit" size="sm" className="h-9 bg-red-600 hover:bg-red-500 text-white font-semibold">
            Search
          </Button>
        </form>
      </div>

      {/* CRM Customer Grid/Table */}
      <div className="border border-zinc-900 bg-zinc-900/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-900/30 text-xs font-semibold text-zinc-400 uppercase">
                <th className="p-4">Customer</th>
                <th className="p-4">Registered</th>
                <th className="p-4">Lifetime Spent</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500 italic">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  // Calculate Customer Lifetime Value (LTV)
                  const ltv = u.orders
                    .filter((o) => o.status === "paid" || o.status === "completed")
                    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

                  const cartItems = u.cart?.items || [];
                  const cartItemsForDrawer = cartItems.map((item) => ({
                    id: item.id,
                    quantity: item.quantity,
                    movie: {
                      title: item.movie.title,
                      price: Number(item.movie.price),
                    },
                  }));

                  const ordersForDrawer = u.orders.map((o) => ({
                    id: o.id,
                    totalAmount: Number(o.totalAmount),
                    status: o.status,
                    orderDate: o.orderDate,
                  }));

                  const userForDrawer = {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    createdAt: u.createdAt,
                    banned: u.banned,
                    banReason: u.banReason,
                    banExpires: u.banExpires,
                  };

                  return (
                    <tr key={u.id} className="hover:bg-zinc-900/30 transition-colors">
                      {/* Customer Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-400 text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-200">{u.name}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Reg Date */}
                      <td className="p-4 text-zinc-400">
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                          day: "numeric",
                        })}
                      </td>

                      {/* LTV */}
                      <td className="p-4 font-bold text-zinc-200">
                        SEK {ltv.toFixed(2)}
                      </td>

                      {/* Ban Status */}
                      <td className="p-4">
                        {u.banned ? (
                          <Badge className="bg-red-950/40 text-red-400 border border-red-900/40 font-bold uppercase text-[9px]">
                            Suspended
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 font-bold uppercase text-[9px]">
                            Active
                          </Badge>
                        )}
                      </td>

                      {/* Actions Trigger Drawer */}
                      <td className="p-4 text-right">
                        <UserDrawer
                          user={userForDrawer}
                          cartItems={cartItemsForDrawer}
                          orders={ordersForDrawer}
                          lifetimeSpent={ltv}
                          triggerElement={
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 text-[11px] hover:bg-zinc-800 hover:text-white"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1 text-zinc-400" />
                              View Profile
                            </Button>
                          }
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
