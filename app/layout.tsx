import { Geist, Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}
    >
      <body>
        <ThemeProvider>
          
          <header className="h-16 flex items-center border-b px-4">
            <nav className="flex">
              <Button asChild variant="ghost" size="sm" className="ml-2"> 
           
                <Link href="/">Home</Link>
              </Button>

              <Button asChild variant="ghost" size="sm" className="ml-2"> 
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </nav>
          </header>
          
          {children}</ThemeProvider>
      </body>
    </html>
  )
}
