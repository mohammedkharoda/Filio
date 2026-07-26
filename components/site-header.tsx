import Link from "next/link";
import { PiArrowRight } from "react-icons/pi";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/forms", label: "All forms" },
  { href: "/eligibility", label: "Find your form" },
  { href: "/glossary", label: "Glossary" },
];

/**
 * Marketing-page header: the wordmark, the three public routes, one CTA.
 * Card-white bar, not paper: the logo's cream folder needs the lighter ground to read.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 shadow-[0_8px_30px_rgba(99,62,40,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-7">
        <Link href="/" aria-label="Filio home" className="shrink-0">
          <BrandLogo className="h-9 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-border/70 bg-background/60 p-1 text-sm font-semibold text-muted-foreground shadow-sm sm:flex" aria-label="Main navigation">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-4 py-2 transition-[background-color,color] hover:bg-card hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>

        <Button asChild size="sm">
          <Link href="/eligibility">
            Start free <PiArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
