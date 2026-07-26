"use client";

import { PiQuestion } from "react-icons/pi";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GLOSSARY, type GlossaryKey } from "@/content/glossary";

/**
 * Inline term explainer. Wrap a tax term to give it a tooltip sourced from the
 * single glossary, so every term has a one-line plain-language explanation (§10).
 */
export function GlossaryTip({ term }: { term: GlossaryKey }) {
  const entry = GLOSSARY[term];
  if (!entry) return null;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-0.5 align-middle text-primary underline decoration-dotted underline-offset-2 hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
            aria-label={`What is ${entry.term}?`}
          >
            {entry.term}
            <PiQuestion className="h-3.5 w-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold text-foreground">{entry.term}</p>
          <p className="mt-1 text-muted-foreground">{entry.short}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
