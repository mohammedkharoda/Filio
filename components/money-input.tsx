"use client";

import type * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
  id: string;
  label: React.ReactNode;
  value: number;
  onValueChange: (value: number) => void;
  hint?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

/**
 * A rupee-prefixed amount field. Fully controlled from the store value, so an
 * external change (e.g. a Form 16 import) reflects immediately without local state.
 */
export function MoneyInput({
  id,
  label,
  value,
  onValueChange,
  hint,
  placeholder = "0",
  className,
}: MoneyInputProps) {
  const display = value ? String(value) : "";

  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-muted-foreground"
          aria-hidden
        >
          ₹
        </span>
        <Input
          id={id}
          name={id}
          inputMode="numeric"
          autoComplete="off"
          aria-describedby={hint ? `${id}-hint` : undefined}
          className="pl-8 text-right font-semibold tabular-nums"
          placeholder={placeholder}
          value={display}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, "");
            onValueChange(raw ? Number(raw) : 0);
          }}
        />
      </div>
      {hint ? <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
