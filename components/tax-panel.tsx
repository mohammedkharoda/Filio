"use client";

import * as React from "react";
import { PiArrowDownRight, PiCheck, PiInfo, PiStack, PiTrendDown } from "react-icons/pi";
import { computeForForm, type FormComputation } from "@/lib/tax-engine/multi-form";
import type { RegimeResult } from "@/lib/tax-engine/types";
import { getForm } from "@/lib/tax-engine/forms";
import { buildTaxInput, totalTdsPaid, useFilioStore } from "@/store";
import { cn, formatINR } from "@/lib/utils";
import { AnimatedINR } from "@/components/animated-inr";
import { Badge } from "@/components/ui/badge";
import { GlossaryTip } from "@/components/glossary-tip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function Row({
  label,
  value,
  strong,
}: {
  label: React.ReactNode;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 py-1", strong && "font-bold")}>
      <span className={cn("text-sm", !strong && "text-muted-foreground")}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function RegimeMini({
  result,
  isCheaper,
  isChosen,
}: {
  result: RegimeResult;
  isCheaper: boolean;
  isChosen: boolean;
}) {
  const isNew = result.regime === "new";
  return (
    <div
      className={cn(
        "min-w-0 flex-1 rounded-xl border p-3.5 transition-[background-color,border-color,box-shadow]",
        isCheaper
          ? "border-success/45 bg-success-soft/70 shadow-sm"
          : "border-border bg-card hover:border-primary/20",
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{isNew ? "New" : "Old"}</span>
        {isCheaper ? (
          <Badge variant="success">
            <PiCheck className="h-3 w-3" /> Cheaper
          </Badge>
        ) : isChosen ? (
          <Badge variant="primary">Chosen</Badge>
        ) : null}
      </div>
      <p className="truncate text-xl font-bold tabular-nums tracking-tight">{formatINR(result.totalTax)}</p>
    </div>
  );
}

export function TaxPanel({ className }: { className?: string }) {
  const data = useFilioStore((s) => s.data);
  const form = getForm(data.selectedForm);
  const comp: FormComputation = React.useMemo(
    () =>
      computeForForm(
        data.selectedForm,
        buildTaxInput(data),
        { capitalGains: data.capitalGains, business: data.business, presumptive: data.presumptive },
        data.assessmentYear as "2026-27",
      ),
    [data],
  );

  const result = comp.comparison;
  const chosen = data.chosenRegime ?? result.cheaper;
  const chosenResult = chosen === "new" ? result.new : result.old;
  const tds = totalTdsPaid(data);
  const balance = chosenResult.totalTax - tds; // >0 payable, <0 refund
  const isRefund = balance < 0;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-primary/15 bg-card/95 shadow-[0_24px_70px_rgba(99,62,40,0.13)] backdrop-blur-sm",
        className,
      )}
      aria-label="Live tax estimate"
    >
      {/* Hero: the chosen liability, front and centre. */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-strong px-5 py-5 text-primary-foreground">
        <span aria-hidden className="absolute -right-12 -top-16 h-40 w-40 rounded-full border-[24px] border-white/10" />
        <div className="flex items-center justify-between gap-2">
          <p className="relative flex items-center gap-2 text-sm font-semibold opacity-95">
            <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.14)]" aria-hidden />
            {comp.staged ? "Tax on your core income" : "Your total tax"}
          </p>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
            {form.name} · AY {result.assessmentYear}
          </span>
        </div>
        <div aria-live="polite" aria-atomic="true">
          <AnimatedINR
            value={chosenResult.totalTax}
            className="relative mt-2 block text-4xl font-bold tabular-nums tracking-tight"
          />
        </div>
        <div
          className={cn(
            "relative mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-sm font-semibold",
            "bg-white/15 backdrop-blur-sm",
          )}
        >
          <PiArrowDownRight className={cn("h-4 w-4", !isRefund && "rotate-180")} aria-hidden />
          {balance === 0
            ? "Nothing to pay or refund"
            : isRefund
              ? `Refund ${formatINR(-balance)}`
              : `To pay ${formatINR(balance)}`}
        </div>
      </div>

      <div className="p-5">
        {/* Old vs New at a glance */}
        <p className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Old vs new regime
        </p>
        <div className="flex gap-2">
          <RegimeMini
            result={result.old}
            isCheaper={result.cheaper === "old"}
            isChosen={chosen === "old"}
          />
          <RegimeMini
            result={result.new}
            isCheaper={result.cheaper === "new"}
            isChosen={chosen === "new"}
          />
        </div>

        {result.saving > 0 ? (
          <p className="mt-3 flex items-center gap-2 rounded-xl border border-success/10 bg-success-soft px-3 py-2.5 text-sm font-semibold text-success">
            <PiTrendDown className="h-4 w-4" aria-hidden />
            The {result.cheaper === "new" ? "new" : "old"} regime saves {formatINR(result.saving)}.
          </p>
        ) : (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            Both regimes cost the same right now.
          </p>
        )}

        {/* Staged heads (ITR-2/3/4): reported honestly, finalized on the portal. */}
        {comp.staged && comp.stagedHeads.length > 0 && (
          <div className="mt-4 rounded-xl border border-warning/40 bg-warning-soft/70 p-4">
            <p className="flex items-center gap-2 text-sm font-bold text-warning">
              <PiStack className="h-4 w-4" aria-hidden /> Finalized on the portal
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              The figure above covers your salary, interest, and deductions. These heads are added
              and taxed when you file:
            </p>
            <ul className="mt-2 space-y-2">
              {comp.stagedHeads.map((h) => (
                <li key={h.key} className="rounded-lg bg-card p-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">{h.label}</span>
                    <span className="text-sm font-bold tabular-nums">{formatINR(h.amount)}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {h.indicativeTax != null ? (
                      <>
                        Indicative tax {formatINR(h.indicativeTax)}. {h.note}
                      </>
                    ) : (
                      h.note
                    )}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* TDS + balance */}
        <div className="mt-4 rounded-2xl border border-border/70 bg-muted/55 p-4">
          <Row label={<GlossaryTip term="tds" />} value={formatINR(tds)} />
          <div className="mt-1 border-t border-border pt-2">
            {balance > 0 ? (
              <Row label="Balance tax to pay" value={formatINR(balance)} strong />
            ) : balance < 0 ? (
              <Row label="Expected refund" value={formatINR(-balance)} strong />
            ) : (
              <Row label="Nothing to pay or refund" value={formatINR(0)} strong />
            )}
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <PiInfo className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            {comp.staged
              ? "A partial estimate. Capital-gains and business tax are confirmed on the portal."
              : "An estimate. Confirm on the portal before you file."}
          </p>
        </div>

        <Accordion type="single" collapsible className="mt-2">
          <AccordionItem value="how" className="border-b-0">
            <AccordionTrigger className="text-sm">How is this worked out?</AccordionTrigger>
            <AccordionContent>
              Filio applies the AY {result.assessmentYear} slab rates, the{" "}
              <GlossaryTip term="standardDeduction" />, your deductions, the{" "}
              <GlossaryTip term="rebate87A" />, and 4% <GlossaryTip term="cess" />, then compares
              both regimes and highlights the cheaper one.
              {comp.staged
                ? " For this form, capital-gains, business, and presumptive tax are added on the portal, where set-off and indexation apply."
                : " Surcharge never applies within ITR-1 (income up to Rs 50 lakh)."}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
