import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { HelpPanel } from "@/components/help-panel";
import { AmbientBackground } from "@/components/ambient-background";

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Filio — Private ITR Preparation, Made Clear",
  description:
    "Filio is a calm, private helper that prepares your income tax return in your browser. Find the right form (ITR-1 to ITR-4), answer plain questions, see both regimes compared live, and file on the official portal. Your data never leaves your device.",
  applicationName: "Filio",
  keywords: [
    "ITR filing",
    "income tax return India",
    "ITR-1",
    "ITR-2",
    "ITR-3",
    "ITR-4",
    "old vs new tax regime",
  ],
  openGraph: {
    type: "website",
    siteName: "Filio",
    title: "Your ITR, finally made clear",
    description: "Find your form, compare both regimes, and prepare a field-by-field filing summary—privately in your browser.",
  },
  twitter: {
    card: "summary",
    title: "Filio — Private ITR preparation",
    description: "All four individual ITR forms, two regimes compared, zero data uploads.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f8f2ea",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${grotesk.variable} ${jakarta.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <AmbientBackground />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <main id="main" className="relative z-0 flex-1">
          {children}
        </main>
        <SiteFooter />
        <HelpPanel />
      </body>
    </html>
  );
}
