import { PiInfo } from "react-icons/pi";

/** The short "why we ask this" line shown on each wizard step (§5). */
export function WhyWeAsk({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-secondary/60 px-4 py-3 text-sm leading-relaxed text-secondary-foreground">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card text-primary shadow-sm">
        <PiInfo className="h-4 w-4" aria-hidden />
      </span>
      <span>
        <span className="font-semibold">Why we ask: </span>
        {children}
      </span>
    </p>
  );
}
