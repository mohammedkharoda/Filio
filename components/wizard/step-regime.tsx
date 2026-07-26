"use client";

import * as React from "react";
import { PiSparkle } from "react-icons/pi";
import { computeTax } from "@/lib/tax-engine/engine";
import { buildTaxInput, useFilioStore } from "@/store";
import { WhyWeAsk } from "@/components/why-we-ask";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GlossaryTip } from "@/components/glossary-tip";
import { formatINR } from "@/lib/utils";
import type { Regime } from "@/store/types";

export function StepRegime() {
  const data = useFilioStore((s) => s.data);
  const setChosenRegime = useFilioStore((s) => s.setChosenRegime);
  const result = React.useMemo(
    () => computeTax(buildTaxInput(data), data.assessmentYear as "2026-27"),
    [data],
  );

  const value = data.chosenRegime ?? "auto";
  const recommended = result.cheaper;

  const options: { key: "auto" | Regime; title: React.ReactNode; sub: React.ReactNode }[] = [
    {
      key: "auto",
      title: "Let Filio pick the cheaper regime",
      sub: (
        <>
          Recommended. Right now that&apos;s the{" "}
          <strong>{recommended === "new" ? "new" : "old"} regime</strong>,{" "}
          {result.saving > 0 ? `saving ${formatINR(result.saving)}.` : "both cost the same."}
        </>
      ),
    },
    {
      key: "new",
      title: <GlossaryTip term="newRegime" />,
      sub: <>Total tax {formatINR(result.new.totalTax)}. Lower rates, few deductions.</>,
    },
    {
      key: "old",
      title: <GlossaryTip term="oldRegime" />,
      sub: <>Total tax {formatINR(result.old.totalTax)}. Higher rates, more deductions.</>,
    },
  ];

  return (
    <div className="space-y-6">
      <WhyWeAsk>
        You choose which tax regime to file under. Filio has already worked out both, so you can go
        with the cheaper one or pick yourself.
      </WhyWeAsk>

      <div className="flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm font-semibold text-success">
        <PiSparkle className="h-5 w-5" />
        The {recommended === "new" ? "new" : "old"} regime is cheaper for you
        {result.saving > 0 ? ` by ${formatINR(result.saving)}` : ""}.
      </div>

      <RadioGroup
        value={value}
        onValueChange={(v) => setChosenRegime(v === "auto" ? null : (v as Regime))}
        className="gap-3"
      >
        {options.map((opt) => (
          <label
            key={opt.key}
            className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted/40 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-secondary/60"
          >
            <RadioGroupItem value={opt.key} id={`regime-${opt.key}`} className="mt-1" />
            <div>
              <p className="font-bold">{opt.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{opt.sub}</p>
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
