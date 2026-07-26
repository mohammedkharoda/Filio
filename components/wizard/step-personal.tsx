"use client";

import * as React from "react";
import { PiCheckCircle, PiWarning } from "react-icons/pi";
import { useFilioStore } from "@/store";
import { TextField } from "@/components/text-field";
import { WhyWeAsk } from "@/components/why-we-ask";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GlossaryTip } from "@/components/glossary-tip";
import {
  ageBandFromDob,
  checkPan,
  normalizeMobileInput,
  normalizePanInput,
  validateEmail,
  validateMobile,
} from "@/lib/validation";
import type { AgeBand } from "@/lib/tax-engine/types";

const AGE_OPTIONS: { value: AgeBand; label: string }[] = [
  { value: "below60", label: "Under 60" },
  { value: "senior60to80", label: "60 to 80 (senior citizen)" },
  { value: "superSenior80plus", label: "80 or above (super senior)" },
];

export function StepPersonal() {
  const personal = useFilioStore((s) => s.data.personal);
  const setPersonal = useFilioStore((s) => s.setPersonal);

  // Complaining while someone is still mid-PAN is what made this field feel
  // broken, so a problem is only voiced once they leave the field or fill it.
  const [panTouched, setPanTouched] = React.useState(false);
  const [mobileTouched, setMobileTouched] = React.useState(false);

  const panCheck = checkPan(personal.pan);
  const panSettled = panTouched || personal.pan.length === 10;
  const panError =
    panSettled && (panCheck.status === "incomplete" || panCheck.status === "invalid")
      ? panCheck.message
      : null;

  const emailError = validateEmail(personal.email);
  const mobileError =
    mobileTouched || personal.mobile.length === 10 ? validateMobile(personal.mobile) : null;

  /** Below the PAN box: a progress count, a warning, or confirmation of the holder. */
  let panHint: React.ReactNode = "Your 10-character Permanent Account Number.";
  if (panCheck.status === "valid") {
    panHint = (
      <span className="inline-flex items-center gap-1.5 font-medium text-success">
        <PiCheckCircle className="h-4 w-4 shrink-0" aria-hidden />
        {panCheck.message} This is the PAN your return is filed under.
      </span>
    );
  } else if (panCheck.status === "mismatch") {
    panHint = (
      <span className="inline-flex items-start gap-1.5 font-medium text-warning">
        <PiWarning className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {panCheck.message}
      </span>
    );
  } else if (panCheck.status === "incomplete" && !panSettled) {
    panHint = panCheck.message;
  }

  // When a valid DOB is entered, suggest the age band automatically.
  React.useEffect(() => {
    const band = ageBandFromDob(personal.dob);
    if (band && band !== personal.ageBand) setPersonal({ ageBand: band });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personal.dob]);

  return (
    <div className="space-y-6">
      <WhyWeAsk>
        These are the identity details that go at the top of your return. They stay on your device.
        Filio never sends them anywhere.
      </WhyWeAsk>

      <TextField
        id="pan"
        label={<><GlossaryTip term="pan" /> </>}
        placeholder="ABCDE1234F"
        value={personal.pan}
        // Roomier than a PAN so a spaced or +prefixed paste reaches the
        // normalizer instead of being clipped by the browser first.
        maxLength={14}
        autoComplete="off"
        spellCheck={false}
        style={{ textTransform: "uppercase" }}
        onChange={(e) => setPersonal({ pan: normalizePanInput(e.target.value) })}
        onBlur={() => setPanTouched(true)}
        error={panError}
        hint={panHint}
      />

      <TextField
        id="fullName"
        label="Full name (as on PAN)"
        placeholder="Your full name"
        autoComplete="name"
        value={personal.fullName}
        onChange={(e) => setPersonal({ fullName: e.target.value })}
      />

      <TextField
        id="dob"
        label="Date of birth"
        type="date"
        autoComplete="bday"
        value={personal.dob}
        onChange={(e) => setPersonal({ dob: e.target.value })}
        hint="Used only to work out your age band for tax."
      />

      <div className="grid gap-2">
        <Label>Your age on 31 March 2026</Label>
        <RadioGroup
          value={personal.ageBand}
          onValueChange={(v) => setPersonal({ ageBand: v as AgeBand })}
          className="gap-2"
        >
          {AGE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 transition-[background-color,border-color,box-shadow] hover:bg-muted/50 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-secondary has-[button[data-state=checked]]:shadow-sm"
            >
              <RadioGroupItem value={opt.value} id={`age-${opt.value}`} />
              <span className="font-medium">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
        <p className="text-sm text-muted-foreground">
          Seniors get a higher <GlossaryTip term="basicExemption" /> in the old regime.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="email"
          label="Email (optional)"
          type="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="you@example.com"
          value={personal.email}
          onChange={(e) => setPersonal({ email: e.target.value })}
          error={personal.email ? emailError : null}
        />
        <TextField
          id="mobile"
          label="Mobile (optional)"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          value={personal.mobile}
          maxLength={18}
          onChange={(e) => setPersonal({ mobile: normalizeMobileInput(e.target.value) })}
          onBlur={() => setMobileTouched(true)}
          error={mobileError}
          hint="10 digits. Any +91 or leading 0 gets dropped for you."
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4 transition-[background-color,border-color,box-shadow] hover:bg-muted/35 has-[button[data-state=checked]]:border-primary/50 has-[button[data-state=checked]]:bg-secondary/40 has-[button[data-state=checked]]:shadow-sm">
        <Checkbox
          checked={personal.residentConfirmed}
          onCheckedChange={(v) => setPersonal({ residentConfirmed: v === true })}
          id="resident"
          className="mt-0.5"
        />
        <span className="text-sm">
          I confirm I was a <GlossaryTip term="resident" /> of India for tax purposes in FY
          2025-26. (ITR-1 is only for residents.)
        </span>
      </label>
    </div>
  );
}
