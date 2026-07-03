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
import { Menu, ShoppingCart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          name: true,
          image: true,
          email: true,
          role: true,
        },
      })
    : null;

  const isAdmin = currentUser?.role === "admin";
  const avatarUrl = currentUser?.image || (currentUser ? `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}` : "");

  const cartQuantityResult = session?.user?.id
    ? await prisma.cartItem.aggregate({
        where: {
          cart: {
            userId: session.user.id,
          },
        },
        _sum: {
          quantity: true,
        },
      })
    : null;

  const cartQuantity = cartQuantityResult?._sum.quantity ?? 0;
  const cartLabel = session ? `Cart(${cartQuantity})` : "Cart";

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
        <ThemeProvider defaultTheme="dark" enableSystem={false}>
          {/* top nav */}
          {/* desktop nav stays normal, mobile nav becomes dropdown */}
          <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 backdrop-blur">
            <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <Link
                href="/"
                className="flex min-w-0 items-center gap-3 text-base font-bold tracking-tight text-white sm:text-lg"
              >
                {/* popcorn icon */}
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-xl ring-1 ring-red-400/40">
                  🍿
                </span>

                <span className="truncate leading-tight">
                  LONELY RIDER <span className="text-red-400">TEAM</span>
                </span>
              </Link>

              {/* desktop nav */}
              <div className="hidden items-center gap-x-5 text-sm text-zinc-300 md:flex">
                <Link href="/" className="transition hover:text-white">
                  Home
                </Link>

                <Link href="/movies" className="transition hover:text-white">
                  Movies
                </Link>

                <Link href="/cart" className="relative transition hover:text-white p-1" aria-label="Shopping Cart">
                  <ShoppingCart className="h-5 w-5" />
                  {cartQuantity > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-1 ring-zinc-950">
                      {cartQuantity}
                    </span>
                  )}
                </Link>

                {session && currentUser ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="relative h-8 w-8 rounded-full overflow-hidden focus:outline-none ring-2 ring-red-500/20 hover:ring-red-500/50 transition shrink-0 cursor-pointer">
                        <img
                          src={avatarUrl}
                          alt={currentUser.name}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 border-zinc-800 bg-zinc-950 text-zinc-100"
                    >
                      <div className="flex flex-col px-2 py-1.5 text-xs text-zinc-400 border-b border-zinc-800/60 pb-2 mb-1">
                        <span className="font-semibold text-zinc-200">{currentUser.name}</span>
                        <span className="truncate text-zinc-400">{currentUser.email}</span>
                      </div>

                      <DropdownMenuItem asChild>
                        <Link href="/user-dashboard">Dashboard</Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem asChild>
                        <Link href="/user-dashboard/profile">Profile</Link>
                      </DropdownMenuItem>

                      {isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/movies/create">Create movie</Link>
                        </DropdownMenuItem>
                      )}

                      <div className="border-t border-zinc-800/60 mt-1 pt-1">
                        <SignOutButton
                          variant="ghost"
                          className="h-9 w-full justify-start px-2 text-zinc-100 hover:bg-zinc-800 hover:text-white font-normal"
                        >
                          Sign Out
                        </SignOutButton>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
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

              {/* mobile nav */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Open navigation menu"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-100 transition hover:border-red-500 hover:text-red-300"
                    >
                      <Menu className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-56 border-zinc-800 bg-zinc-950 text-zinc-100"
                  >
                    <DropdownMenuItem asChild>
                      <Link href="/">Home</Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/movies">Movies</Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/cart" className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Cart {cartQuantity > 0 && `(${cartQuantity})`}
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/user-dashboard">Dashboard</Link>
                    </DropdownMenuItem>

                    {session ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/user-dashboard/profile">Profile</Link>
                        </DropdownMenuItem>

                        {isAdmin && (
                          <DropdownMenuItem asChild>
                            <Link href="/movies/create">Create movie</Link>
                          </DropdownMenuItem>
                        )}

                        <div className="px-2 py-1.5">
                          <SignOutButton
                            variant="ghost"
                            className="h-9 w-full justify-start px-2 text-zinc-100 hover:bg-zinc-800 hover:text-white"
                          >
                            Sign Out
                          </SignOutButton>
                        </div>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/sign-in">Sign In</Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href="/register">Register</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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