"use client";

import React, { useState } from "react";
import { Bell, AlertTriangle, Check, Loader2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { restockMovieAction } from "../_actions/restock-movie-action";
import { toast } from "sonner";

type LowStockMovie = {
  id: string;
  title: string;
  stock: number;
};

type Props = {
  initialMovies: LowStockMovie[];
};

export function LowStockBell({ initialMovies }: Props) {
  const [movies, setMovies] = useState<LowStockMovie[]>(initialMovies);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEditing = (movie: LowStockMovie) => {
    setEditingId(movie.id);
    setStockInput(movie.stock);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleRestock = async (id: string) => {
    if (stockInput < 0) {
      toast.error("Stock level cannot be negative.");
      return;
    }

    setIsSubmitting(true);
    const result = await restockMovieAction(id, stockInput);
    setIsSubmitting(false);

    if (result.ok) {
      toast.success("Stock level updated successfully!");
      // Update local state: if new stock is 5 or more, remove it from alerts.
      // Otherwise, update the stock number in the list.
      if (stockInput >= 5) {
        setMovies((prev) => prev.filter((m) => m.id !== id));
      } else {
        setMovies((prev) =>
          prev.map((m) => (m.id === id ? { ...m, stock: stockInput } : m))
        );
      }
      setEditingId(null);
    } else {
      toast.error(result.error);
    }
  };

  const alertCount = movies.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative flex items-center justify-center p-2 rounded-full hover:bg-zinc-800 transition border border-transparent hover:border-zinc-700 focus:outline-none">
          <Bell className="h-5 w-5 text-zinc-300 hover:text-white transition-colors" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md animate-pulse">
              {alertCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 bg-zinc-900 border-zinc-800 text-white shadow-2xl rounded-2xl overflow-hidden">
        {/* Dropdown Header */}
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <h4 className="font-semibold text-sm text-zinc-200">Inventory Alerts</h4>
          {alertCount > 0 && (
            <span className="text-[11px] font-medium bg-red-950 text-red-400 border border-red-800/40 px-2 py-0.5 rounded-full">
              {alertCount} item{alertCount > 1 ? "s" : ""} low
            </span>
          )}
        </div>

        {/* Dropdown List */}
        <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-800">
          {movies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-2">
              <div className="bg-emerald-950/40 border border-emerald-800/40 p-2 rounded-full text-emerald-400">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-zinc-200">Stock Levels Healthy</p>
              <p className="text-[10px] text-zinc-500">All products have 5 or more copies in stock.</p>
            </div>
          ) : (
            movies.map((movie) => (
              <div key={movie.id} className="p-3 space-y-2 hover:bg-zinc-800/40 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{movie.title}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      Critical Stock: <span className="font-bold text-amber-400">{movie.stock} left</span>
                    </p>
                  </div>
                  
                  {editingId !== movie.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 px-2"
                      onClick={() => startEditing(movie)}
                    >
                      Restock
                    </Button>
                  )}
                </div>

                {/* Inline Restock Input Form */}
                {editingId === movie.id && (
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      type="number"
                      className="h-8 w-20 text-xs bg-zinc-950 border-zinc-800 focus:border-red-500 text-white rounded-md"
                      value={stockInput}
                      onChange={(e) => setStockInput(Number(e.target.value))}
                      disabled={isSubmitting}
                      min={0}
                    />
                    <Button
                      size="icon"
                      className="h-8 w-8 bg-red-600 hover:bg-red-500 text-white"
                      onClick={() => handleRestock(movie.id)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      onClick={cancelEditing}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
