"use client";

import React from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type RevenueData = {
  date: string;
  revenue: number;
};

type ProductData = {
  title: string;
  quantity: number;
};

type Props = {
  revenueTrend: RevenueData[];
  topProducts: ProductData[];
};

export function SalesCharts({ revenueTrend, topProducts }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 30-Day Sales Trend Area Chart */}
      <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-900 p-6 rounded-2xl h-[400px] flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-200">Revenue Growth Trend</h3>
          <p className="text-[10px] text-zinc-500 mt-1">Daily gross revenues compiled from paid checkouts over the last 30 days.</p>
        </div>

        <div className="flex-1 w-full mt-4">
          {revenueTrend.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500 italic">
              No sales data recorded in the last 30 days.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `SEK ${val}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "12px" }}
                  labelStyle={{ color: "#a1a1aa", fontSize: "10px", fontWeight: "bold" }}
                  itemStyle={{ color: "#ef4444", fontSize: "11px" }}
                  formatter={(value: any) => [`SEK ${Number(value).toFixed(2)}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Products Bar Chart */}
      <div className="bg-zinc-900/40 border border-zinc-900 p-6 rounded-2xl h-[400px] flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-200">Top Performing Titles</h3>
          <p className="text-[10px] text-zinc-500 mt-1">Best-selling movies sorted by cumulative order quantities.</p>
        </div>

        <div className="flex-1 w-full mt-4">
          {topProducts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500 italic">
              No product sales data recorded yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis
                  dataKey="title"
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                  tickFormatter={(val) => (val.length > 10 ? `${val.slice(0, 10)}...` : val)}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "12px" }}
                  labelStyle={{ color: "#a1a1aa", fontSize: "10px", fontWeight: "bold" }}
                  itemStyle={{ color: "#f59e0b", fontSize: "11px" }}
                  formatter={(value: any) => [value, "Copies Sold"]}
                />
                <Bar dataKey="quantity" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
