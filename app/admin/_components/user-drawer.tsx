"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { banUserAction, unbanUserAction } from "../_actions/moderation-actions";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, ShoppingCart, Receipt, Calendar, CreditCard, Loader2 } from "lucide-react";

type CartItemData = {
  id: string;
  quantity: number;
  movie: {
    title: string;
    price: number | any;
  };
};

type OrderData = {
  id: string;
  totalAmount: number | any;
  status: string;
  orderDate: Date;
};

type UserData = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
};

type Props = {
  user: UserData;
  cartItems: CartItemData[];
  orders: OrderData[];
  lifetimeSpent: number;
  triggerElement: React.ReactNode;
};

export function UserDrawer({ user, cartItems, orders, lifetimeSpent, triggerElement }: Props) {
  const [banned, setBanned] = useState(!!user.banned);
  const [banReason, setBanReason] = useState(user.banReason || "");
  const [banExpires, setBanExpires] = useState<Date | null>(user.banExpires);
  
  const [reasonInput, setReasonInput] = useState("");
  const [durationInput, setDurationInput] = useState<number>(0); // 0 = permanent
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBan = async () => {
    if (!reasonInput.trim()) {
      toast.error("Please enter a reason for the suspension.");
      return;
    }

    setIsSubmitting(true);
    const res = await banUserAction(user.id, reasonInput, durationInput || undefined);
    setIsSubmitting(false);

    if (res.ok) {
      toast.success(`${user.name} has been suspended.`);
      setBanned(true);
      setBanReason(reasonInput);
      
      let expireDate: Date | null = null;
      if (durationInput > 0) {
        expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + durationInput);
      }
      setBanExpires(expireDate);
      setReasonInput("");
      setDurationInput(0);
    } else {
      toast.error(res.error);
    }
  };

  const handleUnban = async () => {
    setIsSubmitting(true);
    const res = await unbanUserAction(user.id);
    setIsSubmitting(false);

    if (res.ok) {
      toast.success(`${user.name}'s account has been restored.`);
      setBanned(false);
      setBanReason(null);
      setBanExpires(null);
    } else {
      toast.error(res.error);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{triggerElement}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-zinc-950 text-white border-zinc-900 flex flex-col p-0">
        
        {/* Drawer Header */}
        <SheetHeader className="p-6 border-b border-zinc-900 bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-zinc-100 text-lg font-bold truncate">{user.name}</SheetTitle>
              <SheetDescription className="text-zinc-500 text-xs truncate">{user.email}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Scrollable Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* LTV & Member Since Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-2xl">
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="h-3 w-3 text-red-500" />
                Lifetime Value
              </p>
              <p className="text-2xl font-bold text-red-500 mt-1">SEK {lifetimeSpent.toFixed(2)}</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-900 p-4 rounded-2xl">
              <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-zinc-400" />
                Registered
              </p>
              <p className="text-sm font-semibold text-zinc-300 mt-2">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Active Cart Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Active Shopping Cart
            </h3>
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4">
              {cartItems.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">User's shopping cart is currently empty.</p>
              ) : (
                <div className="space-y-3 divide-y divide-zinc-900">
                  {cartItems.map((item, idx) => (
                    <div key={item.id} className={`flex justify-between items-center text-xs ${idx > 0 ? "pt-2.5" : ""}`}>
                      <div className="min-w-0 pr-4">
                        <p className="font-semibold text-zinc-200 truncate">{item.movie.title}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Quantity: {item.quantity}</p>
                      </div>
                      <span className="font-medium text-zinc-400 shrink-0">
                        SEK {(Number(item.movie.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Past Orders Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Order History
            </h3>
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4">
              {orders.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No purchase history recorded.</p>
              ) : (
                <div className="space-y-4 max-h-48 overflow-y-auto pr-1">
                  {orders.map((order) => (
                    <div key={order.id} className="flex justify-between items-start text-xs border-b border-zinc-900 pb-2.5 last:border-0 last:pb-0">
                      <div>
                        <p className="font-mono text-[10px] text-zinc-500">ID: {order.id.slice(-8).toUpperCase()}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-zinc-200">SEK {Number(order.totalAmount).toFixed(2)}</p>
                        <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold mt-1 uppercase ${
                          order.status === "paid" || order.status === "completed"
                            ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/40"
                            : "bg-amber-950/60 text-amber-400 border border-amber-900/40"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Moderation / Ban Panel */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Account Moderation
            </h3>
            
            <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-4">
              {banned ? (
                <div className="space-y-4">
                  <div className="flex gap-2.5 items-start bg-red-950/20 border border-red-900/30 p-3.5 rounded-xl">
                    <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-red-400">Account Suspended</p>
                      <p className="text-zinc-400"><span className="text-zinc-500 font-semibold">Reason:</span> {banReason}</p>
                      {banExpires && (
                        <p className="text-[10px] text-zinc-500">
                          Suspension lifts: {new Date(banExpires).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full text-xs border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900/80"
                    onClick={handleUnban}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4 mr-2 text-emerald-400" />
                        Unban Account
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase">Reason for Ban</label>
                    <Input
                      placeholder="Enter policy violation reason..."
                      className="h-9 text-xs bg-zinc-950 border-zinc-900 focus:border-red-500"
                      value={reasonInput}
                      onChange={(e) => setReasonInput(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-semibold uppercase">Ban Duration</label>
                    <div className="grid grid-cols-3 gap-2">
                      <DurationButton current={durationInput} value={0} label="Permanent" select={setDurationInput} disabled={isSubmitting} />
                      <DurationButton current={durationInput} value={3} label="3 Days" select={setDurationInput} disabled={isSubmitting} />
                      <DurationButton current={durationInput} value={7} label="7 Days" select={setDurationInput} disabled={isSubmitting} />
                    </div>
                  </div>

                  <Button
                    className="w-full text-xs bg-red-600 hover:bg-red-500 text-white font-bold mt-2"
                    onClick={handleBan}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Suspend Account"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}

function DurationButton({
  current,
  value,
  label,
  select,
  disabled
}: {
  current: number;
  value: number;
  label: string;
  select: (val: number) => void;
  disabled: boolean;
}) {
  const isActive = current === value;
  return (
    <button
      type="button"
      className={`py-1.5 text-[10px] font-semibold border rounded-lg transition ${
        isActive
          ? "bg-red-950/20 border-red-500/60 text-red-400"
          : "bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
      }`}
      onClick={() => select(value)}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
