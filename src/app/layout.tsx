import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Logo } from "@/components/logo";

const publicSans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://belowtrace.vercel.app"),
  title: { default: "BelowTrace Detroit — Will the City fix your sewer line?", template: "%s · BelowTrace Detroit" },
  description:
    "Detroit is spending $184M fixing sewer connections and does not publish where. Enter an address to see what is under the house, who owns each segment, and who might pay.",
  openGraph: {
    title: "BelowTrace Detroit",
    description: "What is under your house, who owns each segment, and whether the City's $184M is coming to your alley.",
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
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
            <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-md text-ink no-underline" aria-label="BelowTrace Detroit home">
              <Logo />
              <span className="flex flex-col whitespace-nowrap text-base font-bold leading-[0.9] tracking-tight sm:block sm:text-lg sm:leading-normal">
                <span>BelowTrace</span>
                <span className="font-medium text-ink-3 sm:ml-1 sm:inline">Detroit</span>
              </span>
            </Link>
            <nav className="flex items-center gap-0.5 text-[0.95rem]" aria-label="Main">
              <Link href="/method" className="whitespace-nowrap rounded-md px-2.5 py-2 text-ink-2 hover:bg-sunk hover:text-ink sm:px-3">
                Method
              </Link>
              <Link href="/map" className="whitespace-nowrap rounded-md px-2.5 py-2 text-ink-2 hover:bg-sunk hover:text-ink sm:px-3">
                Map
              </Link>
              {/* On phones the footer's "See every source" link covers these. */}
              <Link href="/about" className="hidden whitespace-nowrap rounded-md px-3 py-2 text-ink-2 hover:bg-sunk hover:text-ink sm:inline">
                About
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
