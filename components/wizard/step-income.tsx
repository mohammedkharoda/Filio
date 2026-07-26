"use client";

import * as React from "react";
import { PiCheckCircle, PiFileArrowUp, PiSpinner, PiShieldCheck, PiWarning } from "react-icons/pi";
import { useFilioStore } from "@/store";
import { parseForm16, type Form16Extract } from "@/lib/form16";
import { MoneyInput } from "@/components/money-input";
import { TextField } from "@/components/text-field";
import { WhyWeAsk } from "@/components/why-we-ask";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GlossaryTip } from "@/components/glossary-tip";
import { formatINR } from "@/lib/utils";

type ParseState =
  | { status: "idle" }
  | { status: "parsing" }
  | { status: "done"; extract: Form16Extract; fileName: string }
  | { status: "error"; message: string };

export function StepIncome() {
  const salary = useFilioStore((s) => s.data.salary);
  const setSalary = useFilioStore((s) => s.setSalary);
  const setPersonal = useFilioStore((s) => s.setPersonal);
  const personalPan = useFilioStore((s) => s.data.personal.pan);
  const [parse, setParse] = React.useState<ParseState>({ status: "idle" });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setParse({ status: "parsing" });
    try {
      const extract = await parseForm16(file);
      setParse({ status: "done", extract, fileName: file.name });
    } catch {
      setParse({
        status: "error",
        message: "Filio couldn't read that PDF. You can type the numbers in manually below.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <WhyWeAsk>
        Your salary and the tax already deducted (TDS) are the core of your return. Upload your{" "}
        <GlossaryTip term="form16" /> to fill these in, or type them yourself.
      </WhyWeAsk>

      {/* Form 16 upload — parsed in the browser, confirmed by you */}
      <div className="rounded-2xl border border-dashed border-primary/40 bg-secondary/30 p-5">
        <div className="flex items-start gap-3">
          <PiShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden />
          <div className="flex-1">
            <h3 className="font-bold">Upload Form 16 (optional)</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Read entirely in your browser. The file never leaves your device. You confirm every
              number before it&apos;s used.
            </p>

            <div className="mt-3">
              <label className="inline-flex">
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={onFile}
                />
                <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted/60">
                  <PiFileArrowUp className="h-4 w-4 text-primary" /> Choose Form 16 PDF
                </span>
              </label>
            </div>

            {parse.status === "parsing" && (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <PiSpinner className="h-4 w-4 animate-spin" /> Reading your Form 16…
              </p>
            )}

            {parse.status === "error" && (
              <p className="mt-3 flex items-center gap-2 text-sm text-warning">
                <PiWarning className="h-4 w-4" /> {parse.message}
              </p>
            )}

            {parse.status === "done" && (
              <ExtractReview
                extract={parse.extract}
                fileName={parse.fileName}
                onApplyGross={(v) => setSalary({ grossSalary: v })}
                onApplyTds={(v) => setSalary({ tdsOnSalary: v })}
                onApplyTan={(v) => setSalary({ employerTan: v })}
                onApplyName={(v) => setSalary({ employerName: v })}
                onApplyPan={(v) => !personalPan && setPersonal({ pan: v })}
              />
            )}
          </div>
        </div>
      </div>

      {/* Manual / confirmation fields */}
      <div className="grid gap-3">
        <Label>Is this salary or pension?</Label>
        <RadioGroup
          value={salary.isPension ? "pension" : "salary"}
          onValueChange={(v) => setSalary({ isPension: v === "pension" })}
          className="grid-cols-2"
        >
          {[
            { v: "salary", label: "Salary" },
            { v: "pension", label: "Pension" },
          ].map((o) => (
            <label
              key={o.v}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 hover:bg-muted/50 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-secondary"
            >
              <RadioGroupItem value={o.v} id={`inc-${o.v}`} />
              <span className="font-medium">{o.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <MoneyInput
        id="grossSalary"
        label={<>Gross {salary.isPension ? "pension" : "salary"} for the year</>}
        value={salary.grossSalary}
        onValueChange={(v) => setSalary({ grossSalary: v })}
        hint="The total before any standard deduction. From Form 16 Part B (Gross Salary)."
      />

      <MoneyInput
        id="tdsOnSalary"
        label={<><GlossaryTip term="tds" /> already deducted on this income</>}
        value={salary.tdsOnSalary}
        onValueChange={(v) => setSalary({ tdsOnSalary: v })}
        hint="From Form 16 Part A (total tax deducted). Counts towards what you've already paid."
      />

      <MoneyInput
        id="familyPension"
        label={<><GlossaryTip term="familyPension" /> received (if any)</>}
        value={salary.familyPension}
        onValueChange={(v) => setSalary({ familyPension: v })}
        hint="Leave as 0 if this doesn't apply to you."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="employerName"
          label="Employer name (optional)"
          value={salary.employerName}
          onChange={(e) => setSalary({ employerName: e.target.value })}
        />
        <TextField
          id="employerTan"
          label={<><GlossaryTip term="tan" /> (optional)</>}
          value={salary.employerTan}
          placeholder="ABCD12345E"
          onChange={(e) => setSalary({ employerTan: e.target.value.toUpperCase() })}
          style={{ textTransform: "uppercase" }}
        />
      </div>
    </div>
  );
}

function ExtractRow({
  label,
  value,
  onApply,
}: {
  label: string;
  value: string;
  onApply: () => void;
}) {
  const [applied, setApplied] = React.useState(false);
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg bg-card p-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-semibold">{value}</p>
      </div>
      <Button
        size="sm"
        variant={applied ? "success" : "secondary"}
        onClick={() => {
          onApply();
          setApplied(true);
        }}
      >
        {applied ? (
          <>
            <PiCheckCircle className="h-4 w-4" /> Added
          </>
        ) : (
          "Use this"
        )}
      </Button>
    </li>
  );
}

function ExtractReview({
  extract,
  fileName,
  onApplyGross,
  onApplyTds,
  onApplyTan,
  onApplyName,
  onApplyPan,
}: {
  extract: Form16Extract;
  fileName: string;
  onApplyGross: (v: number) => void;
  onApplyTds: (v: number) => void;
  onApplyTan: (v: string) => void;
  onApplyName: (v: string) => void;
  onApplyPan: (v: string) => void;
}) {
  const nothing =
    extract.lowConfidence &&
    !extract.employerTan &&
    !extract.employerName &&
    !extract.employeePan;

  if (nothing) {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm text-warning">
        <PiWarning className="h-4 w-4" /> Filio read “{fileName}” but couldn&apos;t confidently
        find the figures. Please enter them manually below.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <p className="text-sm font-semibold text-foreground">
        Found in “{fileName}”. Please check each value, then add it:
      </p>
      <ul className="mt-2 space-y-2">
        {extract.grossSalary != null && (
          <ExtractRow
            label="Gross salary"
            value={formatINR(extract.grossSalary)}
            onApply={() => onApplyGross(extract.grossSalary!)}
          />
        )}
        {extract.tds != null && (
          <ExtractRow
            label="Total tax deducted (TDS)"
            value={formatINR(extract.tds)}
            onApply={() => onApplyTds(extract.tds!)}
          />
        )}
        {extract.employerName && (
          <ExtractRow
            label="Employer name"
            value={extract.employerName}
            onApply={() => onApplyName(extract.employerName!)}
          />
        )}
        {extract.employerTan && (
          <ExtractRow
            label="Employer TAN"
            value={extract.employerTan}
            onApply={() => onApplyTan(extract.employerTan!)}
          />
        )}
        {extract.employeePan && (
          <ExtractRow
            label="Your PAN"
            value={extract.employeePan}
            onApply={() => onApplyPan(extract.employeePan!)}
          />
        )}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Filio never fills these silently. Nothing is used until you tap “Use this”.
      </p>
    </div>
  );
}
