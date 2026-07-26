"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
}

export function TextField({ id, name, label, hint, error, className, ...props }: TextFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name ?? id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
