import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

// Serif for reading (headings + lesson text), Plex Sans for interface, Plex Mono for numbers/code
const serif = Source_Serif_4({ variable: "--font-serif-var", subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"] });
const sans = IBM_Plex_Sans({ variable: "--font-sans-var", subsets: ["latin"], style: ["normal", "italic"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono-var", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Inference, Simplified",
  description:
    "A plain-English, interactive course on inference engineering, based on the book Inference Engineering by Philip Kiely.",
};

// Runs before paint so a saved theme doesn't flash
const themeScript = `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="font-serif text-[1.2rem] font-semibold tracking-[-0.01em]">
              Inference, Simplified
            </Link>
            <nav className="flex items-center gap-1 text-sm text-ink-soft">
              <Link href="/#course" className="rounded-md px-3 py-1.5 hover:bg-bg-soft hover:text-ink">
                Course
              </Link>
              <Link href="/glossary" className="rounded-md px-3 py-1.5 hover:bg-bg-soft hover:text-ink">
                Glossary
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line py-8 text-center text-sm text-ink-faint">
          A study companion to <cite className="font-serif not-italic">Inference Engineering</cite> by Philip Kiely.
        </footer>
      </body>
    </html>
  );
}
