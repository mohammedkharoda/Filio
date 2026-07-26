// lib/tax-engine/types.ts
// Shared types for the deterministic tax engine. No tax logic lives here.

export type AgeBand = "below60" | "senior60to80" | "superSenior80plus";
export type Regime = "old" | "new";

/**
 * Chapter VI-A and related deduction amounts as CLAIMED by the user (rupees).
 * The engine caps each figure per the active config; the user enters actuals.
 * Under the new regime only `employerNps80CCD2` is allowed — the rest are ignored.
 */
export interface Deductions {
  section80C: number; // 80C + 80CCC + 80CCD(1) — combined cap ₹1.5L
  section80CCD1B: number; // additional NPS — cap ₹50k, over and above 80C
  section80D_self: number; // health insurance: self + family
  section80D_parents: number; // health insurance: parents
  parentsAreSenior: boolean; // raises the 80D parents cap
  section80TTA_TTB: number; // savings/deposit interest (80TTA <60, 80TTB senior)
  employerNps80CCD2: number; // employer NPS contribution — allowed in BOTH regimes
}

/**
 * A person's income picture for a single ITR-1 return. All amounts in rupees.
 * `salaryIncome`/`pensionIncome` are GROSS (before the standard deduction).
 * `housePropertyIncome` is the NET figure across up to two properties and may be
 * negative (a loss); the engine applies the statutory set-off cap.
 */
export interface TaxInput {
  ageBand: AgeBand;
  salaryIncome: number;
  pensionIncome: number;
  familyPensionIncome: number;
  housePropertyIncome: number; // net; may be negative
  otherIncome: number; // interest income, etc.
  ltcg112A: number; // long-term capital gains u/s 112A (>= 0)
  deductions: Deductions;
}

export interface SlabRow {
  from: number;
  to: number; // Infinity for the top band
  rate: number;
  taxableInBand: number;
  taxInBand: number;
}

export interface RegimeResult {
  regime: Regime;
  grossTotalIncome: number; // all heads, before deductions (slab income + taxable LTCG)
  standardDeduction: number;
  familyPensionDeduction: number;
  chapterVIADeductions: number; // total Chapter VI-A applied (0 in new regime except NPS)
  totalDeductions: number;
  taxableIncome: number; // slab income after deductions, rounded per s.288A
  taxableLtcg: number; // 112A gains above the exemption (special-rate)
  slabTax: number; // tax on slab income before rebate/relief
  rebate87A: number; // s.87A rebate applied
  marginalRelief: number; // relief given (new regime, income just over ₹12L)
  ltcgTax: number; // special-rate tax on taxable LTCG
  surcharge: number; // always 0 within ITR-1 scope
  taxBeforeCess: number; // after rebate/relief + LTCG tax + surcharge
  cess: number; // 4% health & education cess
  totalTax: number; // final liability, rounded per s.288B
  slabBreakdown: SlabRow[];
}

export interface ComparisonResult {
  assessmentYear: string;
  financialYear: string;
  old: RegimeResult;
  new: RegimeResult;
  cheaper: Regime;
  saving: number; // absolute difference in total tax between regimes
}
