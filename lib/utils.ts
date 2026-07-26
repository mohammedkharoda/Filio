import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts predictably. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a rupee amount for display, e.g. 102440 → "₹1,02,440". */
export function formatINR(amount: number): string {
  const rounded = Math.round(amount);
  return `₹${rounded.toLocaleString("en-IN")}`;
}

/** Parse a user-typed money string into a non-negative number of rupees. */
export function parseAmount(value: string): number {
  const n = Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : Math.round(n);
}
