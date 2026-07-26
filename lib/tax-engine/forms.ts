// lib/tax-engine/forms.ts
// Registry of the individual ITR forms Filio covers. Routing, the form hub, the
// recommender, and the wizard all read their shape from here — one source of truth.

import type { FormId } from "@/store/types";

/** "ready" = fully computed by Filio (ITR-1). "beta" = flow built, some tax staged for the portal. */
export type FormStatus = "ready" | "beta";

/** Every wizard step Filio can render. A form lists the ordered subset it needs. */
export type StepKey =
  | "personal"
  | "income"
  | "houseProperties"
  | "capitalGains"
  | "business"
  | "presumptive"
  | "other"
  | "deductions"
  | "regime";

export interface FormMeta {
  id: FormId;
  name: string; // "ITR-1"
  aka: string; // "Sahaj"
  tagline: string; // one line: who it is for
  who: string[]; // fits if...
  notFor: string; // one-line "not for" summary
  status: FormStatus;
  steps: StepKey[]; // ordered wizard steps
}

export const FORMS: Record<FormId, FormMeta> = {
  ITR1: {
    id: "ITR1",
    name: "ITR-1",
    aka: "Sahaj",
    tagline: "Salary or pension, one or two houses, interest income.",
    who: [
      "Resident individual, total income up to Rs 50 lakh",
      "Salary or pension, and interest income",
      "Up to two house properties",
      "Long-term equity gains (112A) up to Rs 1.25 lakh",
    ],
    notFor: "Business income, capital gains beyond small 112A, foreign assets.",
    status: "ready",
    steps: ["personal", "income", "other", "deductions", "regime"],
  },
  ITR2: {
    id: "ITR2",
    name: "ITR-2",
    aka: "",
    tagline: "Capital gains, more than two houses, or higher income. No business.",
    who: [
      "Individuals and HUFs with no business or profession income",
      "Capital gains from shares, mutual funds, or property",
      "More than two house properties, or income above Rs 50 lakh",
      "Foreign income or assets, or a company directorship",
    ],
    notFor: "Income from a business or profession (use ITR-3 or ITR-4).",
    status: "beta",
    steps: ["personal", "income", "houseProperties", "capitalGains", "other", "deductions", "regime"],
  },
  ITR3: {
    id: "ITR3",
    name: "ITR-3",
    aka: "",
    tagline: "Income from a business or profession, with regular books.",
    who: [
      "Individuals and HUFs running a business or profession",
      "Anyone keeping regular books of account",
      "Can also carry salary, house property, and capital gains",
    ],
    notFor: "Simple presumptive filers (ITR-4 is lighter).",
    status: "beta",
    steps: [
      "personal",
      "income",
      "business",
      "houseProperties",
      "capitalGains",
      "other",
      "deductions",
      "regime",
    ],
  },
  ITR4: {
    id: "ITR4",
    name: "ITR-4",
    aka: "Sugam",
    tagline: "Presumptive business or profession income (44AD / 44ADA / 44AE).",
    who: [
      "Resident individuals, HUFs, and firms (not LLPs)",
      "Presumptive income under 44AD, 44ADA, or 44AE",
      "Total income up to Rs 50 lakh",
      "Can also carry salary, one house, and interest income",
    ],
    notFor: "Regular books, capital gains, or income above Rs 50 lakh (use ITR-3 or ITR-2).",
    status: "beta",
    steps: ["personal", "income", "presumptive", "other", "deductions", "regime"],
  },
};

export const FORM_ORDER: FormId[] = ["ITR1", "ITR2", "ITR3", "ITR4"];

export function getForm(id: FormId): FormMeta {
  return FORMS[id];
}
