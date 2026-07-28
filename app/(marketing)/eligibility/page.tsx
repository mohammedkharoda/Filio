"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PiArrowRight, PiSquaresFour, PiSparkle } from "react-icons/pi";
import { motion, useReducedMotion } from "motion/react";
import { useFilioStore } from "@/store";
import type { FormId } from "@/store/types";
import { useHydratedStore } from "@/components/use-hydrated";
import {
  checkEligibility,
  presumptiveAlternative,
  recommendForm,
  type EligibilityAnswers,
} from "@/lib/tax-engine/eligibility";
import { getForm } from "@/lib/tax-engine/forms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { YesNo } from "@/components/yes-no";
import { GlossaryTip } from "@/components/glossary-tip";
import { TrustBadge } from "@/components/trust-badge";

interface Question {
  key: keyof EligibilityAnswers;
  question: React.ReactNode;
}

const QUESTIONS: Question[] = [
  { key: "isIndividual", question: "Are you filing as an individual (not a HUF, firm, or company)?" },
  {
    key: "isResident",
    question: (
      <>
        Were you a <GlossaryTip term="resident" /> of India for tax purposes this year?
      </>
    ),
  },
  { key: "totalIncomeOver50L", question: "Is your total income for the year more than Rs 50 lakh?" },
  { key: "hasBusinessOrProfessionIncome", question: "Do you have any income from a business or profession?" },
  {
    key: "hasShortTermCapitalGains",
    question: "Did you have any short-term capital gains (e.g. selling shares held under a year)?",
  },
  {
    key: "hasOtherCapitalGains",
    question: (
      <>
        Are your <GlossaryTip term="ltcg112A" /> more than Rs 1.25 lakh, or do you have any other
        capital gains?
      </>
    ),
  },
  { key: "hasCryptoVda", question: "Did you earn any income from crypto or other virtual digital assets?" },
  {
    key: "hasForeignIncomeOrAssets",
    question: "Do you have foreign income, foreign assets, or signing authority in an account outside India?",
  },
  { key: "moreThanTwoHouseProperties", question: "Do you own more than two house properties?" },
  { key: "isCompanyDirector", question: "Are you a director in any company?" },
  { key: "holdsUnlistedShares", question: "Did you hold unlisted (private company) shares this year?" },
  { key: "agriculturalIncomeOver5k", question: "Is your agricultural income more than Rs 5,000?" },
  {
    key: "hasSpecialRateOtherIncome",
    question: "Do you have income from lotteries, racehorses, legal gambling, or another special-rate source?",
  },
  {
    key: "hasTds194N",
    question: "Was tax deducted from cash withdrawals under Section 194N?",
  },
  {
    key: "hasDeferredEsopTax",
    question: "Do you have deferred tax on ESOPs received from an eligible start-up?",
  },
  {
    key: "hasBroughtForwardLoss",
    question: "Do you have a brought-forward loss or a loss that must be carried forward?",
  },
];

export default function RecommenderPage() {
  const hydrated = useHydratedStore();
  const router = useRouter();
  const reduce = useReducedMotion();
  const answers = useFilioStore((s) => s.data.eligibility);
  const setEligibility = useFilioStore((s) => s.setEligibility);
  const confirmEligibility = useFilioStore((s) => s.confirmEligibility);
  const setSelectedForm = useFilioStore((s) => s.setSelectedForm);

  const recommended = recommendForm(answers);
  const form = getForm(recommended);
  const disqualifiers = checkEligibility(answers).disqualifiers;
  const showPresumptive = recommended === "ITR3" && presumptiveAlternative(answers);

  const start = (id: FormId) => {
    setSelectedForm(id);
    confirmEligibility(true);
    router.push("/wizard");
  };

  if (!hydrated) {
    return <div className="mx-auto max-w-3xl px-5 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Which ITR fits you?</h1>
      <p className="mt-2 text-muted-foreground">
        Sixteen quick questions. Filio points you to the right form and prepares it. This takes about
        two minutes, and nothing is saved anywhere but your own browser.
      </p>
      <TrustBadge className="mt-4" />

      <div className="mt-8 space-y-3">
        {QUESTIONS.map((q) => (
          <Card key={String(q.key)} className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold leading-snug sm:max-w-md">{q.question}</p>
              <YesNo
                name={typeof q.question === "string" ? q.question : String(q.key)}
                value={answers[q.key]}
                onChange={(yes) => setEligibility({ [q.key]: yes } as Partial<EligibilityAnswers>)}
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Recommendation */}
      <motion.div
        key={recommended}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <div className="bg-primary px-6 py-5 text-primary-foreground">
          <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
            <PiSparkle className="h-4 w-4" aria-hidden /> Your form
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-extrabold">
              {form.name}
              {form.aka ? <span className="text-primary-foreground/70"> · {form.aka}</span> : null}
            </span>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
              {form.status === "ready" ? "Supported tax computed" : "Beta · some tax staged"}
            </span>
          </div>
          <p className="mt-2 max-w-lg text-sm text-primary-foreground/90">{form.tagline}</p>
        </div>

        <div className="p-6">
          {recommended === "ITR1" ? (
            <p className="text-sm text-muted-foreground">
              Your answers describe a simple return. ITR-1 (Sahaj) is the lightest form and Filio
              computes it end to end.
            </p>
          ) : (
            <>
              <p className="text-sm font-semibold">Why this form, in plain language:</p>
              <ul className="mt-2 space-y-2">
                {disqualifiers.length > 0 ? (
                  disqualifiers.map((d) => (
                    <li key={d.code} className="rounded-lg bg-muted/60 p-3 text-sm">
                      {d.message}
                    </li>
                  ))
                ) : (
                  <li className="rounded-lg bg-muted/60 p-3 text-sm">
                    You have income from a business or profession, which {form.name} handles.
                  </li>
                )}
              </ul>
            </>
          )}

          <Button className="mt-5 w-full sm:w-auto" size="lg" onClick={() => start(recommended)}>
            Prepare {form.name} <PiArrowRight className="h-5 w-5" />
          </Button>

          {showPresumptive && (
            <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-4">
              <p className="text-sm font-semibold text-secondary-foreground">
                Running a small business on presumptive income?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                ITR-4 (Sugam) is lighter if you declare profit under 44AD, 44ADA, or 44AE and your
                income is up to Rs 50 lakh.
              </p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={() => start("ITR4")}>
                Use ITR-4 instead
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      <Link
        href="/forms"
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <PiSquaresFour className="h-4 w-4" /> Know your form already? Compare all four
      </Link>
    </div>
  );
}
