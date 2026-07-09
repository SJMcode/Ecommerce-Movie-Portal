import React from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, BarChart3, ArrowLeft, ShieldAlert } from "lucide-react";

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
    <div className="flex min-h-screen bg-zinc-950 text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-900 bg-zinc-950/60 backdrop-blur p-6 flex flex-col gap-8 shrink-0">
        <div className="flex items-center gap-2 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-lg ring-1 ring-red-400/40">
            👑
          </span>
          <span className="font-bold tracking-tight text-sm text-zinc-100">
            LONELY RIDER <span className="text-red-500">ADMIN</span>
          </span>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          <SidebarLink href="/admin/analytics" label="Business Analytics" icon={BarChart3} />
          <SidebarLink href="/admin/users" label="User Management" icon={Users} />
        </nav>

        <div className="border-t border-zinc-900 pt-4 flex flex-col gap-2">
          <div className="px-2 py-1">
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Logged in as</p>
            <p className="text-xs text-zinc-300 font-semibold truncate mt-0.5">{user.name}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900/50 rounded-lg transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Exit to Store
          </Link>
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 min-w-0 flex flex-col bg-zinc-950">
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
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
