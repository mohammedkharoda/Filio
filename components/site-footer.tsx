import Link from "next/link";
import { PiArrowSquareOut } from "react-icons/pi";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <BrandLogo className="h-8 w-auto" />
          <span className="font-semibold text-foreground">
            A calm way to prepare your income tax return
          </span>
        </div>
        <p className="mt-3 max-w-3xl leading-relaxed">
          Filio is an educational preparation tool. It is <strong>not</strong> a tax advisor and{" "}
          <strong>not</strong> an authorised e-filing intermediary. Filio never submits anything to
          the government. You review the figures and file the return yourself on the official
          portal. You are responsible for the return you file.
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed">
          Your data and documents stay in your browser and never leave your device. No login, no
          accounts, no tracking. Always verify figures against{" "}
          <a
            href="https://www.incometax.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-baseline gap-1 font-semibold text-primary underline underline-offset-4"
          >
            incometax.gov.in
            <PiArrowSquareOut className="h-3.5 w-3.5 shrink-0 self-center" aria-hidden />
          </a>
          .
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <Link href="/forms" className="hover:text-primary">
            All forms
          </Link>
          <Link href="/eligibility" className="hover:text-primary">
            Find your form
          </Link>
          <Link href="/glossary" className="hover:text-primary">
            Glossary
          </Link>
        </div>
        <p className="mt-4 text-xs">Assessment Year 2026-27 · Financial Year 2025-26</p>
      </div>
    </footer>
  );
}
