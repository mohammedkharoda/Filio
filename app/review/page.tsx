"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PiArrowLeft, PiArrowRight, PiWarning } from "react-icons/pi";
import { buildTaxInput, useFilioStore } from "@/store";
import type { FilioData } from "@/store/types";
import { computeForForm } from "@/lib/tax-engine/multi-form";
import { getForm, type StepKey } from "@/lib/tax-engine/forms";
import { useHydratedStore } from "@/components/use-hydrated";
import { validatePan } from "@/lib/validation";
import { formatINR } from "@/lib/utils";
import { STEP_META } from "@/components/wizard/step-registry";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DisclaimerBar } from "@/components/disclaimer-bar";
import { capitalGainTotals, classifyCapitalGain } from "@/lib/capital-gains";

function stepSummary(key: StepKey, data: FilioData, chosenLabel: string, totalTax: number): string {
  const { personal, salary, otherIncome, deductions, capitalGains, business, presumptive, foreignIncome } = data;
  const interest = otherIncome.savingsInterest + otherIncome.depositInterest + otherIncome.otherInterest;
  switch (key) {
    case "personal":
      return `${personal.fullName || "Name not set"} · PAN ${personal.pan || "not set"}`;
    case "income":
      return `${salary.isPension ? "Pension" : "Salary"} ${formatINR(salary.grossSalary)} · TDS ${formatINR(salary.tdsOnSalary)}`;
    case "houseProperties":
      return data.houseProperties.length
        ? `${data.houseProperties.length} propert${data.houseProperties.length === 1 ? "y" : "ies"}`
        : "None added";
    case "capitalGains": {
      const totals = capitalGainTotals(capitalGains);
      return totals.total ? `Net gains ${formatINR(totals.total)}` : "No gains entered";
    }
    case "foreignIncome":
      return `${foreignIncome.incomeEntries.length} income entr${foreignIncome.incomeEntries.length === 1 ? "y" : "ies"} · ${foreignIncome.assetEntries.length} asset disclosure${foreignIncome.assetEntries.length === 1 ? "" : "s"}`;
    case "business":
      return `${business.natureOfBusiness || "Business"} · profit ${formatINR(business.netProfit)}`;
    case "presumptive":
      return presumptive.scheme === "none"
        ? "No scheme chosen"
        : `${presumptive.scheme} · ${formatINR(presumptive.declaredProfit)}`;
    case "other":
      return `Interest ${formatINR(interest)}`;
    case "deductions":
      return `80C ${formatINR(deductions.section80C)} · 80D ${formatINR(deductions.section80D_self + deductions.section80D_parents)}`;
    case "regime":
      return `${chosenLabel} regime · Total tax ${formatINR(totalTax)}`;
    default:
      return "";
  }
}

export default function ReviewPage() {
  const hydrated = useHydratedStore();
  const router = useRouter();
  const data = useFilioStore((s) => s.data);

  const comp = React.useMemo(
    () =>
      computeForForm(
        data.selectedForm,
        buildTaxInput(data),
        { capitalGains: data.capitalGains, business: data.business, presumptive: data.presumptive },
        data.assessmentYear as "2026-27",
      ),
    [data],
  );

  if (!hydrated) {
    return <div className="mx-auto max-w-3xl px-5 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  const form = getForm(data.selectedForm);
  const result = comp.comparison;
  const chosen = data.chosenRegime ?? result.cheaper;
  const chosenResult = chosen === "new" ? result.new : result.old;
  const totalInterest =
    data.otherIncome.savingsInterest + data.otherIncome.depositInterest + data.otherIncome.otherInterest;

  const warnings: string[] = [];
  if (!data.personal.pan || validatePan(data.personal.pan)) warnings.push("Add a valid PAN.");
  if (!data.personal.fullName) warnings.push("Add your full name.");
  if (
    (data.selectedForm === "ITR1" || data.selectedForm === "ITR4") &&
    !data.personal.residentConfirmed
  )
    warnings.push("Confirm you were a resident of India.");
  if (data.salary.grossSalary === 0 && totalInterest === 0)
    warnings.push("No income entered yet. Add your salary or interest.");
  if (comp.staged)
    warnings.push("This form includes heads finalized on the portal. Filio's total is a partial estimate.");
  const incompleteSales = (data.capitalGains.transactions ?? []).filter(
    (transaction) => !classifyCapitalGain(transaction).valid,
  ).length;
  if (incompleteSales > 0)
    warnings.push(`${incompleteSales} capital-gain sale entr${incompleteSales === 1 ? "y is" : "ies are"} incomplete and not included.`);
  const reliefClaimed = data.foreignIncome.incomeEntries.some((entry) => entry.reliefClaimedInr > 0);
  if (reliefClaimed && !data.foreignIncome.form67Filed)
    warnings.push("Foreign tax relief is entered, but Form 67 is not marked as prepared/filed.");

  const sections = form.steps.map((key) => ({
    key,
    title: STEP_META[key].title,
    summary: stepSummary(key, data, chosen, chosenResult.totalTax),
    Comp: STEP_META[key].Comp,
  }));

  return (
    <WizardShell
      nav={{
        steps: form.steps.map((key) => ({ key, title: STEP_META[key].title })),
        current: form.steps.length,
        reviewActive: true,
        onSelectStep: () => router.push("/wizard"),
      }}
    >
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Review your answers</h1>
      <p className="mt-1 text-muted-foreground">
        Check everything and tap any section to edit it inline. Nothing is final until you file on
        the portal.
      </p>

      <div className="mt-4">
        <DisclaimerBar />
      </div>

      {warnings.length > 0 && (
        <div className="mt-4 rounded-xl border border-warning/40 bg-warning-soft p-4">
          <p className="flex items-center gap-2 font-semibold text-warning">
            <PiWarning className="h-4 w-4" /> A few things to check
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <Accordion type="single" collapsible className="mt-4 rounded-2xl border border-border bg-card px-5">
        {sections.map((s) => {
          const StepComp = s.Comp;
          return (
            <AccordionItem key={s.key} value={s.key}>
              <AccordionTrigger>
                <span className="flex flex-col text-left">
                  <span className="font-bold">{s.title}</span>
                  <span className="text-sm font-normal text-muted-foreground">{s.summary}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2">
                  <StepComp />
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => router.push("/wizard")}>
          <PiArrowLeft className="h-5 w-5" /> Back to questions
        </Button>
        <Button size="lg" onClick={() => router.push("/download")}>
          Get my summary <PiArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </WizardShell>
  );
}
