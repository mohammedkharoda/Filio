import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        primary: "bg-secondary text-secondary-foreground",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        beta: "bg-accent text-accent-foreground ring-1 ring-inset ring-primary/20",
        outline: "border border-border bg-card text-muted-foreground",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
