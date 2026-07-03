import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Mail, Shield, Calendar, ArrowLeft } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // Fetch the latest details from DB
  const dbUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      name: true,
      email: true,
      role: true,
      createdAt: true,
      image: true,
    },
  });

  if (!dbUser) {
    redirect("/sign-in");
  }

  const memberSince = dbUser.createdAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="px-6 min-h-[80vh]">
      <section className="flex flex-col gap-8 mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-red-400 font-semibold uppercase tracking-wider text-xs">User Profile</h1>
          <h2 className="text-2xl md:text-4xl font-bold text-white">
            Account Information
          </h2>
          <p className="text-sm text-zinc-400">
            View your personal details and account settings below.
          </p>
        </div>

        <div className="h-px bg-zinc-800"></div>

        <Card className="border border-zinc-800 bg-zinc-900/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center gap-4 pb-6">
            {dbUser.image ? (
              <img
                src={dbUser.image}
                alt={dbUser.name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-red-500/20"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 ring-2 ring-red-500/20">
                <span className="text-2xl font-bold uppercase">
                  {dbUser.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex flex-col">
              <CardTitle className="text-xl font-bold text-white">{dbUser.name}</CardTitle>
              <span className="text-xs text-zinc-400 capitalize">
                {dbUser.role || "User"} Account
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl bg-zinc-950/40 p-4 border border-zinc-800/40">
                <User className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Full Name</span>
                  <p className="text-sm font-medium text-zinc-200">{dbUser.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-zinc-950/40 p-4 border border-zinc-800/40">
                <Mail className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Email Address</span>
                  <p className="text-sm font-medium text-zinc-200 break-all">{dbUser.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-zinc-950/40 p-4 border border-zinc-800/40">
                <Shield className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Role</span>
                  <p className="text-sm font-medium text-zinc-200 capitalize">{dbUser.role || "User"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-zinc-950/40 p-4 border border-zinc-800/40">
                <Calendar className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-xs text-zinc-500 uppercase font-medium tracking-wider">Member Since</span>
                  <p className="text-sm font-medium text-zinc-200">{memberSince}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
