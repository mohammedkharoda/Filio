import { PiLockKey } from "react-icons/pi";
import { cn } from "@/lib/utils";

/** The core trust promise, shown prominently (§5). */
export function TrustBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-primary/25 bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground",
        className,
      )}
    >
      <PiLockKey className="h-4 w-4 text-primary" aria-hidden />
      Your data never leaves your device. No login needed
    </div>
  );
}
