// components/wizard/step-registry.tsx
// Maps each wizard StepKey to its title, subtitle, and component. Forms declare an
// ordered list of step keys in the form registry; the wizard renders them from here.
// Phase 5 adds the wider-form steps (house properties, capital gains, business, presumptive).

import type * as React from "react";
import type { StepKey } from "@/lib/tax-engine/forms";
import { StepPersonal } from "./step-personal";
import { StepIncome } from "./step-income";
import { StepOtherIncome } from "./step-other-income";
import { StepDeductions } from "./step-deductions";
import { StepRegime } from "./step-regime";
import { StepHouseProperties } from "./step-house-properties";
import { StepCapitalGains } from "./step-capital-gains";
import { StepBusiness } from "./step-business";
import { StepPresumptive } from "./step-presumptive";

export interface StepDef {
  title: string;
  subtitle: string;
  Comp: React.ComponentType;
}

export const STEP_META: Record<StepKey, StepDef> = {
  personal: {
    title: "About you",
    subtitle: "The details at the top of your return",
    Comp: StepPersonal,
  },
  income: {
    title: "Your income",
    subtitle: "Salary or pension, and tax already deducted",
    Comp: StepIncome,
  },
  houseProperties: {
    title: "House property",
    subtitle: "Rent, home-loan interest, and self-occupied homes",
    Comp: StepHouseProperties,
  },
  capitalGains: {
    title: "Capital gains",
    subtitle: "Shares, mutual funds, property, and crypto",
    Comp: StepCapitalGains,
  },
  business: {
    title: "Business or profession",
    subtitle: "Your profit as per regular books",
    Comp: StepBusiness,
  },
  presumptive: {
    title: "Presumptive income",
    subtitle: "44AD, 44ADA, or 44AE",
    Comp: StepPresumptive,
  },
  other: {
    title: "Other income",
    subtitle: "Interest and other sources",
    Comp: StepOtherIncome,
  },
  deductions: {
    title: "Deductions",
    subtitle: "Investments, insurance, and NPS",
    Comp: StepDeductions,
  },
  regime: {
    title: "Choose your regime",
    subtitle: "Old vs new, compared for you",
    Comp: StepRegime,
  },
};
