import { PiInfo } from "react-icons/pi";

/** Compact persistent honest disclaimer for working screens (§10). */
export function DisclaimerBar() {
  return (
    <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
      <PiInfo className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <span>
        Filio prepares and explains your return. It never files it. You review every figure and
        file it yourself on the official portal. Filio is not a tax advisor.
      </span>
    </p>
  );
}
