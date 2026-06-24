import { Geist, Geist_Mono, Inter } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SignOutButton } from "@/components/sign-out-button";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await auth.api.getSession({
    headers: await headers(),
  })
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
          <header className="h-16 flex items-center border-b px-4">
            <nav className="flex w-full">
              <Button asChild variant="ghost" size="sm" className="ml-2"> 
           
                <Link href="/">Home</Link>
              </Button>

              {session ? (
                <SignOutButton variant="ghost" className="ml-auto">
                  Sign Out
                </SignOutButton>
              ) : (
                <>
                  <Button asChild variant="ghost" className="ml-auto">
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/register">Register</Link>
                  </Button>
                </>
              )}
            </nav>
          </header>

          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
