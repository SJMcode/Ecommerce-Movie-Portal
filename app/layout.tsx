import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SignOutButton } from "@/components/sign-out-button";
import { Toaster } from "sonner";
import { prisma } from "@/lib/prisma";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // get logged in user/session
  // this decides if nav shows Sign In/Register or Sign Out
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const currentUser = session
    ? await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          role: true,
        },
      })
    : null;

  const isAdmin = currentUser?.role === "admin";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body>
        <ThemeProvider>
          {/* top nav */}
          {/* this layout wraps the whole app, so nav appears on every page */}
          <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur">
            <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <Link
                href="/"
                className="flex items-center gap-3 text-base font-bold tracking-tight text-white sm:text-lg"
              >
                {/* popcorn icon */}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-xl ring-1 ring-red-400/40">
                  🍿
                </span>

                <span className="leading-tight">
                  LONELY RIDER <span className="text-red-400">TEAM</span>
                </span>
              </Link>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-zinc-300 sm:justify-end">
                <Link href="/" className="transition hover:text-white">
                  Home
                </Link>

                <Link href="/movies" className="transition hover:text-white">
                  Movies
                </Link>

                {/* cart link */}
                {/* keep this only if /cart exists or is coming soon */}
                <Link href="/cart" className="transition hover:text-white">
                  Cart
                </Link>

                <Link href="/user-dashboard" className="transition hover:text-white">
                  Dashboard
                </Link>

                {session ? (
                  // user is logged in
                  <>
                    <Link
                      href="/profile"
                      className="transition hover:text-white"
                    >
                      Profile
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/movies/create"
                        className="h-auto p-0 text-zinc-300 hover:bg-transparent hover:text-white"
                      >
                        Create movie
                      </Link>
                    )}

                    <SignOutButton
                      variant="ghost"
                      className="h-auto p-0 text-zinc-300 hover:bg-transparent hover:text-white"
                    >
                      Sign Out
                    </SignOutButton>
                  </>
                ) : (
                  // user is not logged in
                  <>
                    <Link
                      href="/sign-in"
                      className="transition hover:text-white"
                    >
                      Sign In
                    </Link>

                    <Link
                      href="/register"
                      className="transition hover:text-white"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </header>

          {children}

          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
