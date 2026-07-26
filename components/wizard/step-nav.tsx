"use client";

import * as React from "react";
import { PiCheck, PiClipboardText } from "react-icons/pi";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface StepNavItem {
  key: string;
  title: string;
}

interface StepNavProps {
  items: StepNavItem[];
  current: number; // active index; items.length => review stage (all steps done)
  onSelect?: (index: number) => void; // jump to a visited step
  reviewActive?: boolean;
  onReview?: () => void;
  /** Scopes the shared motion layoutId so two instances (desktop + drawer) never collide. */
  idPrefix?: string;
}

/** Vertical step navigation with completion state and a motion active marker. */
export function StepNav({
  items,
  current,
  onSelect,
  reviewActive,
  onReview,
  idPrefix = "",
}: StepNavProps) {
  const reduce = useReducedMotion();
  const spring = reduce
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 500, damping: 40 } as const);

  const renderItem = (
    label: string,
    index: number,
    status: "done" | "active" | "upcoming",
    onClick?: () => void,
    icon?: React.ReactNode,
  ) => {
    const clickable = !!onClick && status !== "upcoming";
    return (
      <li key={`${label}-${index}`} className="relative">
        {status === "active" && (
          <motion.span
            layoutId={`${idPrefix}stepActiveBg`}
            transition={spring}
            className="absolute inset-0 rounded-lg bg-secondary"
            aria-hidden
          />
        )}
        <button
          type="button"
          onClick={clickable ? onClick : undefined}
          disabled={!clickable}
          aria-current={status === "active" ? "step" : undefined}
          className={cn(
            "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
            clickable && "cursor-pointer hover:bg-muted/70",
            status === "active" ? "font-bold text-secondary-foreground" : "font-medium",
            status === "upcoming" && "text-muted-foreground",
          )}
        >
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              status === "done" && "bg-success text-success-foreground",
              status === "active" && "bg-primary text-primary-foreground",
              status === "upcoming" && "border border-border bg-card text-muted-foreground",
            )}
          >
            {icon ?? (status === "done" ? <PiCheck className="h-3.5 w-3.5" aria-hidden /> : index + 1)}
          </span>
          <span className="truncate">{label}</span>
        </button>
      </li>
    );
  };

  return (
    <nav aria-label="Steps">
      <ol className="space-y-0.5">
        {items.map((item, i) => {
          const status: "done" | "active" | "upcoming" =
            i < current ? "done" : i === current ? "active" : "upcoming";
          return renderItem(item.title, i, status, onSelect ? () => onSelect(i) : undefined);
        })}
        {renderItem(
          "Review & file",
          items.length,
          reviewActive ? "active" : current >= items.length ? "done" : "upcoming",
          onReview,
          <PiClipboardText className="h-3.5 w-3.5" aria-hidden />,
        )}
      </ol>
    </nav>
  );
}
