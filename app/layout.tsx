import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Seat Share",
  description: "Giants season tickets, up for grabs.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0d" },
  ],
};

// Runs before first paint so a saved dark preference never flashes light.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-10 border-b border-line bg-bg/80 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-3 px-4 sm:px-8">
            <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
              <Logo />
              Seat Share
            </Link>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
