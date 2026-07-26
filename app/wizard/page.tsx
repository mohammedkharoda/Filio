"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PiArrowLeft, PiArrowRight } from "react-icons/pi";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useFilioStore } from "@/store";
import { useHydratedStore } from "@/components/use-hydrated";
import { validatePan } from "@/lib/validation";
import { getForm } from "@/lib/tax-engine/forms";
import { STEP_META } from "@/components/wizard/step-registry";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function WizardPage() {
  const hydrated = useHydratedStore();
  const router = useRouter();
  const eligibilityConfirmed = useFilioStore((s) => s.data.eligibilityConfirmed);
  const selectedForm = useFilioStore((s) => s.data.selectedForm);
  const pan = useFilioStore((s) => s.data.personal.pan);
  const reduce = useReducedMotion();
  const [step, setStep] = React.useState(0);
  const [showPanErr, setShowPanErr] = React.useState(false);

  React.useEffect(() => {
    if (hydrated && !eligibilityConfirmed) router.replace("/eligibility");
  }, [hydrated, eligibilityConfirmed, router]);

  const form = getForm(selectedForm);
  const steps = React.useMemo(
    () => form.steps.map((key) => ({ key, ...STEP_META[key] })),
    [form],
  );

  if (!hydrated) {
    return <div className="mx-auto max-w-3xl px-5 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  const current = steps[step] ?? steps[0];
  if (!current) return null;
  const StepComp = current.Comp;
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;
  const progress = Math.round(((step + 1) / steps.length) * 100);

  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goNext = () => {
    if (current.key === "personal" && pan && validatePan(pan)) {
      setShowPanErr(true);
      return;
    }
    setShowPanErr(false);
    if (isLast) {
      router.push("/review");
      return;
    }
    goTo(Math.min(step + 1, steps.length - 1));
  };

  const goBack = () => {
    if (isFirst) {
      router.push("/eligibility");
      return;
    }
    goTo(Math.max(step - 1, 0));
  };

  return (
    <WizardShell
      nav={{
        steps: steps.map((s) => ({ key: s.key, title: s.title })),
        current: step,
        onSelectStep: (i) => goTo(i),
        onReview: () => router.push("/review"),
      }}
    >
      <div className="mb-5">
        <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
          <span>
            Step {step + 1} of {steps.length}
          </span>
          <span className="tabular-nums">{progress}%</span>
        </div>
        <Progress value={progress} className="mt-2" aria-label={`Progress: ${progress}%`} />
      </div>

      <h1 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">{current.title}</h1>
      <p className="mt-1 text-pretty text-muted-foreground">{current.subtitle}</p>
      <p className="sr-only" role="status" aria-live="polite">
        Step {step + 1} of {steps.length}: {current.title}
      </p>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <StepComp />
          </motion.div>
        </AnimatePresence>
      </div>

      {showPanErr && (
        <p className="mt-4 text-sm font-medium text-destructive">
          Please fix the PAN before continuing, or clear it to fill in later.
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={goBack}>
          <PiArrowLeft className="h-5 w-5" /> Back
        </Button>
        <Button onClick={goNext} size="lg">
          {isLast ? "Review my answers" : "Continue"} <PiArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </WizardShell>
  );
}
