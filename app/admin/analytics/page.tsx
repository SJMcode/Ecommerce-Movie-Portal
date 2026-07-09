import React from "react";
import { prisma } from "@/lib/prisma";
import { SalesCharts } from "./_components/sales-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Wallet, ShoppingBag, Users } from "lucide-react";

export default async function AdminAnalyticsPage() {
  // 1. Fetch KPI aggregates from database (Completed/Paid orders only)
  const paidOrders = await prisma.order.findMany({
    where: {
      status: { in: ["paid", "completed"] },
    },
    select: {
      totalAmount: true,
    },
  });

  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const totalOrders = paidOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const totalCustomers = await prisma.user.count();

  // 2. Compute 30-day revenue trend (Zero-padded time series)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSales = await prisma.order.findMany({
    where: {
      status: { in: ["paid", "completed"] },
      orderDate: { gte: thirtyDaysAgo },
    },
    select: {
      totalAmount: true,
      orderDate: true,
    },
    orderBy: { orderDate: "asc" },
  });

  const revenueMap = new Map<string, number>();
  // Pre-populate Map with last 30 consecutive dates to ensure no chart gaps
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
    revenueMap.set(dateStr, 0);
  }

  // Populate actual revenue totals
  recentSales.forEach((sale) => {
    const dateStr = new Date(sale.orderDate).toISOString().split("T")[0];
    if (revenueMap.has(dateStr)) {
      revenueMap.set(dateStr, revenueMap.get(dateStr)! + Number(sale.totalAmount));
    }
  });

  const revenueTrend = Array.from(revenueMap.entries()).map(([date, revenue]) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue,
  }));

  // 3. Compile Top 5 Performing Movie Titles
  const soldItems = await prisma.orderItem.findMany({
    where: {
      order: { status: { in: ["paid", "completed"] } },
    },
    include: {
      movie: {
        select: {
          title: true,
        },
      },
    },
  });

  const itemCounts: Record<string, number> = {};
  soldItems.forEach((item) => {
    const title = item.movie.title;
    itemCounts[title] = (itemCounts[title] || 0) + item.quantity;
  });

  const topProducts = Object.entries(itemCounts)
    .map(([title, quantity]) => ({ title, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Business Analytics</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Real-time updates on gross metrics, customer shopping averages, and catalog performances.
        </p>
      </div>

      {/* KPI Stats Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <Card className="bg-zinc-900/40 border-zinc-900 rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Gross Sales</CardTitle>
            <Wallet className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">SEK {totalRevenue.toFixed(2)}</div>
            <p className="text-[9px] text-zinc-500 mt-1">Total revenue from paid checkouts</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/40 border-zinc-900 rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{totalOrders}</div>
            <p className="text-[9px] text-zinc-500 mt-1">Completed purchases processed</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/40 border-zinc-900 rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">SEK {averageOrderValue.toFixed(2)}</div>
            <p className="text-[9px] text-zinc-500 mt-1">Average spent per shopping basket</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/40 border-zinc-900 rounded-2xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{totalCustomers}</div>
            <p className="text-[9px] text-zinc-500 mt-1">Registered shopper accounts</p>
          </CardContent>
        </Card>

      </div>

      {/* Visual Recharts Charts Section */}
      <SalesCharts revenueTrend={revenueTrend} topProducts={topProducts} />

    </div>
  );
}
