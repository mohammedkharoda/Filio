"use client";

import { cn } from "@/lib/utils";

/** A large, accessible Yes/No segmented control for wizard questions. */
export function YesNo({
  value,
  onChange,
  name,
  yesLabel = "Yes",
  noLabel = "No",
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  name: string;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="inline-flex gap-2 rounded-xl bg-muted p-1"
    >
      {[
        { label: yesLabel, val: true },
        { label: noLabel, val: false },
      ].map((opt) => {
        const active = value === opt.val;
        return (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.val)}
            className={cn(
              "min-w-[92px] rounded-lg px-5 py-2.5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
