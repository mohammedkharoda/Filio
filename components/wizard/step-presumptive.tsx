"use client";

import { PiCheck, PiSparkle } from "react-icons/pi";
import { useFilioStore } from "@/store";
import type { PresumptiveInfo } from "@/store/types";
import { MoneyInput } from "@/components/money-input";
import { WhyWeAsk } from "@/components/why-we-ask";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatINR } from "@/lib/utils";

const SCHEMES: { v: PresumptiveInfo["scheme"]; title: string; sub: string }[] = [
  { v: "44AD", title: "44AD", sub: "Small business (trade, manufacturing, retail)" },
  { v: "44ADA", title: "44ADA", sub: "Professionals (doctors, lawyers, consultants)" },
  { v: "44AE", title: "44AE", sub: "Goods carriage (transport)" },
];

/** Statutory minimum presumptive profit for the chosen scheme. */
function suggestedProfit(p: PresumptiveInfo): number {
  if (p.scheme === "44AD") {
    const digital = p.turnover * (Math.min(Math.max(p.digitallyReceivedShare, 0), 100) / 100);
    const cash = Math.max(p.turnover - digital, 0);
    return Math.round(cash * 0.08 + digital * 0.06);
  }
  if (p.scheme === "44ADA") return Math.round(p.turnover * 0.5);
  if (p.scheme === "44AE") return Math.round(p.numVehicles * 7500 * 12);
  return 0;
}

export function StepPresumptive() {
  const p = useFilioStore((s) => s.data.presumptive);
  const setP = useFilioStore((s) => s.setPresumptive);
  const suggestion = suggestedProfit(p);

  return (
    <div className="space-y-6">
      <WhyWeAsk>
        Presumptive schemes let you declare a fixed percentage of turnover as profit, with no books.
        Pick your scheme and Filio suggests the statutory minimum profit.
      </WhyWeAsk>

      <div className="grid gap-2">
        <Label>Which scheme applies?</Label>
        <RadioGroup
          value={p.scheme === "none" ? "" : p.scheme}
          onValueChange={(v) => setP({ scheme: v as PresumptiveInfo["scheme"] })}
          className="gap-2"
        >
          {SCHEMES.map((o) => (
            <label
              key={o.v}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted/50 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-secondary"
            >
              <RadioGroupItem value={o.v} id={`scheme-${o.v}`} className="mt-1" />
              <span>
                <span className="font-bold">{o.title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{o.sub}</span>
              </span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {(p.scheme === "44AD" || p.scheme === "44ADA") && (
        <MoneyInput
          id="turnover"
          label={p.scheme === "44ADA" ? "Gross professional receipts" : "Gross turnover"}
          value={p.turnover}
          onValueChange={(v) => setP({ turnover: v })}
          hint="Total for the year. Must be within the presumptive limit."
        />
      )}

      {p.scheme === "44AD" && (
        <div className="grid gap-1.5">
          <Label htmlFor="digitalShare">Share received digitally (%)</Label>
          <Input
            id="digitalShare"
            inputMode="numeric"
            value={p.digitallyReceivedShare ? String(p.digitallyReceivedShare) : ""}
            placeholder="100"
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^0-9]/g, ""));
              setP({ digitallyReceivedShare: Number.isFinite(n) ? Math.min(n, 100) : 0 });
            }}
          />
          <p className="text-sm text-muted-foreground">
            Digital receipts presume 6% profit; cash presumes 8%.
          </p>
        </div>
      )}

      {p.scheme === "44AE" && (
        <div className="grid gap-1.5">
          <Label htmlFor="vehicles">Number of goods vehicles</Label>
          <Input
            id="vehicles"
            inputMode="numeric"
            value={p.numVehicles ? String(p.numVehicles) : ""}
            placeholder="0"
            onChange={(e) => {
              const n = Number(e.target.value.replace(/[^0-9]/g, ""));
              setP({ numVehicles: Number.isFinite(n) ? n : 0 });
            }}
          />
          <p className="text-sm text-muted-foreground">
            Presumes Rs 7,500 per vehicle per month.
          </p>
        </div>
      )}

      {p.scheme !== "none" && suggestion > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-secondary-foreground">
            <PiSparkle className="h-4 w-4" aria-hidden />
            Suggested minimum profit: {formatINR(suggestion)}
          </p>
          <Button size="sm" variant="secondary" onClick={() => setP({ declaredProfit: suggestion })}>
            {p.declaredProfit === suggestion ? (
              <>
                <PiCheck className="h-4 w-4" /> Applied
              </>
            ) : (
              "Use this"
            )}
          </Button>
        </div>
      )}

      <MoneyInput
        id="declaredProfit"
        label="Presumptive profit you declare"
        value={p.declaredProfit}
        onValueChange={(v) => setP({ declaredProfit: v })}
        hint="You can declare more than the minimum. This is added to your income and taxed at slab rates on the portal."
      />
    </div>
  );
}
