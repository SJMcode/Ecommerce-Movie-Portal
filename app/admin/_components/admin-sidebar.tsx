"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, BarChart3, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

type AdminSidebarProps = {
  userName: string;
};

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-zinc-900 bg-zinc-950/60 backdrop-blur p-4 transition-all duration-300 relative shrink-0 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Collapse/Expand Toggle Trigger */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3 h-6 w-6 rounded-full border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white flex items-center justify-center transition shadow-md z-50 cursor-pointer"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Brand logo */}
      <div className={`flex items-center gap-2 px-1 mb-8 overflow-hidden ${isCollapsed ? "justify-center" : ""}`}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-lg ring-1 ring-red-400/40 shrink-0">
          👑
        </span>
        {!isCollapsed && (
          <span className="font-bold tracking-tight text-sm text-zinc-100 whitespace-nowrap">
            LONELY RIDER <span className="text-red-500">ADMIN</span>
          </span>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1.5 flex-1">
        <SidebarLink
          href="/admin/analytics"
          label="Business Analytics"
          icon={BarChart3}
          isCollapsed={isCollapsed}
          isActive={pathname === "/admin/analytics"}
        />
        <SidebarLink
          href="/admin/users"
          label="User Management"
          icon={Users}
          isCollapsed={isCollapsed}
          isActive={pathname === "/admin/users"}
        />
      </nav>

      {/* User profile metadata */}
      <div className="border-t border-zinc-900 pt-4 flex flex-col gap-2 overflow-hidden">
        {!isCollapsed ? (
          <div className="px-2 py-1">
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Logged in as</p>
            <p className="text-xs text-zinc-300 font-semibold truncate mt-0.5">{userName}</p>
          </div>
        ) : null}
        
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-xl transition ${
            isCollapsed ? "justify-center" : ""
          }`}
          title="Exit to Store"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Exit to Store</span>}
        </Link>
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  isCollapsed,
  isActive,
}: {
  href: string;
  label: string;
  icon: any;
  isCollapsed: boolean;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all border ${
        isActive
          ? "text-zinc-100 bg-zinc-900/60 border-zinc-800"
          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40 border-transparent"
      } ${isCollapsed ? "justify-center" : ""}`}
      title={label}
    >
      <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-red-500" : "text-red-500/80"}`} />
      {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}
