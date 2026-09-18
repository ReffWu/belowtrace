import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Logo } from "@/components/logo";

const publicSans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "BelowTrace Detroit — Sewage in your basement? Start here.", template: "%s · BelowTrace Detroit" },
  description:
    "Enter a Detroit address to see who's responsible for your sewer line, which City programs might pay for the repair, your deadlines, and what public records actually show.",
  openGraph: {
    title: "BelowTrace Detroit",
    description: "Who's responsible for your sewer line, which City programs might pay, and what to do next.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#f6f3ec" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${publicSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <header className="no-print border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5 rounded-md text-ink no-underline" aria-label="BelowTrace Detroit home">
              <Logo className="h-8 w-8" />
              <span className="whitespace-nowrap text-base font-bold tracking-tight sm:text-lg">
                BelowTrace <span className="font-medium text-ink-3">Detroit</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-[0.95rem]">
              <Link href="/sources" className="whitespace-nowrap rounded-md px-3 py-2 text-ink-2 hover:bg-sunk hover:text-ink">
                <span className="sm:hidden">Sources</span>
                <span className="hidden sm:inline">Data &amp; method</span>
              </Link>
            </nav>
          </div>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="no-print border-t border-line bg-sunk/60 text-sm text-ink-2">
          <div className="mx-auto grid max-w-5xl gap-3 px-4 py-8 sm:px-6">
            <p className="max-w-3xl">
              <strong className="text-ink">BelowTrace is not a utility locate, an inspection, or legal advice.</strong> Private sewer lines
              are not marked by MISS DIG 811. Program rules change — confirm with the City before you rely on anything here.
            </p>
            <p>
              Free and open source. Built for the Venture 313 Buildathon 2026 with public data from the City of Detroit, DWSD, HUD and
              FEMA. <Link href="/sources" className="font-medium text-brand underline">See every source</Link>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
