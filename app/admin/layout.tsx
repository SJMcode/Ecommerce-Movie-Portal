import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, BarChart3, ArrowLeft, ShieldAlert } from "lucide-react";

import { AdminSidebar } from "./_components/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Fetch role directly from db to ensure accuracy & type safety
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, name: true },
  });

  if (!user || user.role !== "admin") {
    // Render an unauthorized access screen instead of a raw redirect to be clear
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="max-w-md w-full text-center space-y-6 bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-950 text-red-500 border border-red-800/40">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-sm text-zinc-400">
              This area is restricted to administrators. Your account does not have the required permissions.
            </p>
          </div>
          <ButtonLink href="/" icon={ArrowLeft} text="Back to Main Store" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-white">
      {/* Mobile Top Navbar (Visible only on mobile) */}
      <header className="md:hidden border-b border-zinc-900 bg-zinc-950/80 backdrop-blur px-6 py-4 flex flex-col gap-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/15 text-sm ring-1 ring-red-400/40">
              👑
            </span>
            <span className="font-bold tracking-tight text-xs text-zinc-100">
              LONELY RIDER <span className="text-red-500 font-extrabold">ADMIN</span>
            </span>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-zinc-400 hover:text-white"
          >
            Exit to Store
          </Link>
        </div>
        <nav className="flex gap-2">
          <Link
            href="/admin/analytics"
            className="flex-1 text-center py-2.5 text-xs font-semibold bg-zinc-900/60 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition active:bg-zinc-800"
          >
            Analytics
          </Link>
          <Link
            href="/admin/users"
            className="flex-1 text-center py-2.5 text-xs font-semibold bg-zinc-900/60 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition active:bg-zinc-800"
          >
            Users
          </Link>
        </nav>
      </header>

      {/* Sidebar Navigation (Visible only on Desktop - Collapsible Client Component) */}
      <AdminSidebar userName={user.name || ""} />

      {/* Main Page Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-zinc-950">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40 rounded-xl transition-all border border-transparent hover:border-zinc-800/30"
    >
      <Icon className="h-4 w-4 shrink-0 text-red-500/80" />
      {label}
    </Link>
  );
}

function ButtonLink({ href, text, icon: Icon }: { href: string; text: string; icon: any }) {
  return (
    <Link
      href={href}
      className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition"
    >
      <Icon className="h-4 w-4" />
      {text}
    </Link>
  );
}
