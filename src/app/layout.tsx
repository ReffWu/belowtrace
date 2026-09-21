import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Logo } from "@/components/logo";

const publicSans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://belowtrace.vercel.app"),
  title: { default: "BelowTrace Detroit, Will the City fix your sewer line?", template: "%s · BelowTrace Detroit" },
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
              <span className="flex flex-col whitespace-nowrap text-[0.95rem] font-bold leading-[0.9] tracking-tight xs:text-base sm:block sm:text-lg sm:leading-normal">
                <span>BelowTrace</span>
                <span className="hidden font-medium text-ink-3 xs:block sm:ml-1 sm:inline">Detroit</span>
              </span>
            </Link>
            <nav className="flex shrink-0 items-center gap-0 text-[0.86rem] xs:text-[0.92rem] sm:gap-0.5 sm:text-[0.95rem]" aria-label="Main">
              {[
                { href: "/method", label: "Method" },
                { href: "/map", label: "Map" },
                { href: "/about", label: "About" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="whitespace-nowrap rounded-md px-1.5 py-2 text-ink-2 hover:bg-sunk hover:text-ink xs:px-2 sm:px-3"
                >
                  {l.label}
                </Link>
              ))}
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
              are not marked by MISS DIG 811. Program rules change, so confirm with the City before you rely on anything here.
            </p>
            <p>
              Free and open source. Built for the Venture 313 Buildathon 2026 with public data from the City of Detroit, DWSD, HUD and
              FEMA. <Link href="/sources" className="font-medium text-brand underline">See every source</Link>.{" "}
              <a href="https://github.com/ReffWu/belowtrace" target="_blank" rel="noreferrer" className="font-medium text-brand underline">
                GitHub
              </a>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
