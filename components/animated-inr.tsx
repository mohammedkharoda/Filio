"use client";

import * as React from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { formatINR } from "@/lib/utils";

/**
 * A rupee figure that counts to its new value when the underlying number changes.
 * Motivated motion (skill §5): the live tax panel updates as the user types, and the
 * count-up makes the cause-and-effect legible. Collapses to an instant set under
 * reduced-motion.
 */
export function AnimatedINR({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => formatINR(v));

  React.useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.5, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [value, reduce, mv]);

  return <motion.span className={className}>{text}</motion.span>;
}
