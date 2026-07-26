"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PiArrowRight, PiCheck, PiFileText, PiSparkle } from "react-icons/pi";
import { motion, useReducedMotion } from "motion/react";
import { useFilioStore } from "@/store";
import type { FormId } from "@/store/types";
import { FORMS, FORM_ORDER } from "@/lib/tax-engine/forms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FormsHubPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const setSelectedForm = useFilioStore((s) => s.setSelectedForm);
  const confirmEligibility = useFilioStore((s) => s.confirmEligibility);

  const start = (id: FormId) => {
    setSelectedForm(id);
    confirmEligibility(true);
    router.push("/wizard");
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:py-16">
      <Badge variant="primary"><PiFileText /> Complete form library</Badge>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Every individual ITR, one place</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Filio covers all four individual returns. Not sure which is yours?{" "}
        <Link href="/eligibility" className="font-semibold text-primary hover:underline">
          Answer twelve quick questions
        </Link>{" "}
        and Filio picks for you.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {FORM_ORDER.map((id, i) => {
          const form = FORMS[id];
          return (
            <motion.div
              key={id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={reduce ? undefined : { y: -5 }}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">
                    {form.name}
                    {form.aka ? (
                      <span className="ml-2 text-base font-semibold text-muted-foreground">
                        {form.aka}
                      </span>
                    ) : null}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">{form.tagline}</p>
                </div>
                {form.status === "ready" ? (
                  <Badge variant="success">Fully computed</Badge>
                ) : (
                  <Badge variant="beta">Guided preparation</Badge>
                )}
              </div>

              <ul className="mt-4 flex-1 space-y-2">
                {form.who.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-sm">
                    <PiCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 text-xs text-muted-foreground">Not for: {form.notFor}</p>

              <Button className="mt-4" onClick={() => start(id)}>
                Prepare {form.name} <PiArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 p-5">
        <PiSparkle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Complex forms stay honest about their limits. </span>
          Filio fully computes ITR-1. For ITR-2, ITR-3, and ITR-4 it prepares every section and
          computes your salary, house, and deduction tax, then clearly flags capital-gains, business,
          and presumptive tax as finalized on the official portal.
        </p>
      </div>
    </div>
  );
}
