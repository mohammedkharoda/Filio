"use client";

import { PiInfo } from "react-icons/pi";
import { useFilioStore } from "@/store";
import { MoneyInput } from "@/components/money-input";
import { WhyWeAsk } from "@/components/why-we-ask";
import { Checkbox } from "@/components/ui/checkbox";
import { GlossaryTip } from "@/components/glossary-tip";

export function StepDeductions() {
  const deductions = useFilioStore((s) => s.data.deductions);
  const setDeductions = useFilioStore((s) => s.setDeductions);

  return (
    <div className="space-y-6">
      <WhyWeAsk>
        Deductions lower the tax you owe under the <GlossaryTip term="oldRegime" />. Enter what you
        actually invested or paid. Filio caps each at its legal limit and shows whether the old
        regime wins for you.
      </WhyWeAsk>

      <p className="flex items-start gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <PiInfo className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Most of these count only in the old regime. The new regime ignores them but has lower rates
        and a bigger rebate. Filio compares both for you.
      </p>

      <MoneyInput
        id="section80C"
        label={<><GlossaryTip term="section80C" /></>}
        value={deductions.section80C}
        onValueChange={(v) => setDeductions({ section80C: v })}
        hint="PPF, EPF, ELSS, LIC, home-loan principal, children's tuition, etc. Capped at ₹1,50,000."
      />

      <MoneyInput
        id="section80CCD1B"
        label={<><GlossaryTip term="section80CCD1B" /></>}
        value={deductions.section80CCD1B}
        onValueChange={(v) => setDeductions({ section80CCD1B: v })}
        hint="Your own NPS contribution. Extra ₹50,000 over and above 80C."
      />

      <MoneyInput
        id="section80Dself"
        label={<><GlossaryTip term="section80D" /> for self & family</>}
        value={deductions.section80D_self}
        onValueChange={(v) => setDeductions({ section80D_self: v })}
        hint="Health insurance premium for you and your family. Capped at ₹25,000 (₹50,000 if you're a senior)."
      />

      <MoneyInput
        id="section80Dparents"
        label={<><GlossaryTip term="section80D" /> for parents</>}
        value={deductions.section80D_parents}
        onValueChange={(v) => setDeductions({ section80D_parents: v })}
        hint="Health insurance premium for your parents. Capped at ₹25,000 (₹50,000 if they're seniors)."
      />

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Checkbox
          checked={deductions.parentsAreSenior}
          onCheckedChange={(v) => setDeductions({ parentsAreSenior: v === true })}
          id="parentsSenior"
        />
        <span className="text-sm font-medium">
          My parents are senior citizens (60+), which raises their 80D limit to ₹50,000
        </span>
      </label>

      <MoneyInput
        id="employerNps"
        label={<><GlossaryTip term="section80CCD2" /> (employer NPS)</>}
        value={deductions.employerNps80CCD2}
        onValueChange={(v) => setDeductions({ employerNps80CCD2: v })}
        hint="Employer's NPS contribution (from Form 16). This one is allowed in BOTH regimes."
      />
    </div>
  );
}
