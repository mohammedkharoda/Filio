// store/types.ts
// The full shape of a Filio working session. This lives only in the browser.

import type { AgeBand } from "@/lib/tax-engine/types";
import type { EligibilityAnswers } from "@/lib/tax-engine/eligibility";

export type Regime = "old" | "new";

/** The four individual ITR forms Filio covers. */
export type FormId = "ITR1" | "ITR2" | "ITR3" | "ITR4";

export interface PersonalInfo {
  pan: string;
  fullName: string;
  dob: string; // ISO yyyy-mm-dd
  ageBand: AgeBand;
  residentConfirmed: boolean;
  email: string; // optional, for the taxpayer's own reference on the summary
  mobile: string;
}

export interface SalaryInfo {
  employerName: string;
  employerTan: string;
  grossSalary: number; // gross salary / pension before standard deduction
  isPension: boolean; // treat grossSalary as pension
  familyPension: number;
  tdsOnSalary: number; // TDS already deducted by employer (Form 16 Part A)
}

export interface OtherIncomeInfo {
  savingsInterest: number; // interest from savings bank accounts
  depositInterest: number; // FD / RD / other deposit interest
  otherInterest: number; // e.g. income-tax refund interest, bonds
  housePropertyIncome: number; // net across up to two properties; may be negative
  numHouseProperties: 0 | 1 | 2;
  ltcg112A: number; // long-term capital gains u/s 112A (must be ≤ ₹1.25L for ITR-1)
  otherTds: number; // TDS on interest etc. (Form 26AS)
}

export interface DeductionsInfo {
  section80C: number;
  section80CCD1B: number;
  section80D_self: number;
  section80D_parents: number;
  parentsAreSenior: boolean;
  employerNps80CCD2: number;
  // 80TTA/80TTB is derived from savings/deposit interest at compute time, capped.
}

/**
 * One house property (ITR-2 allows more than the two ITR-1 covers).
 * A self-occupied property has no rent; its only entry is home-loan interest.
 */
export interface HouseProperty {
  label: string;
  kind: "self" | "letout";
  annualRent: number; // gross annual rent received (0 for self-occupied)
  municipalTaxes: number; // taxes actually paid (let-out only)
  homeLoanInterest: number; // interest paid on a loan for this property
}

/**
 * Capital-gains capture for ITR-2/3. Filio records the figures honestly but does
 * NOT compute the special-rate tax itself — grandfathering, indexation and set-off
 * rules are finalized on the portal. Every field feeds a "staged" note, not a total.
 */
export interface CapitalGainsInfo {
  stcgEquity111A: number; // listed equity / equity MF, short-term (u/s 111A)
  stcgOther: number; // other short-term gains (taxed at slab)
  ltcgEquity112A: number; // listed equity / equity MF, long-term (u/s 112A)
  ltcgOther: number; // other long-term gains (u/s 112, property, debt, etc.)
  cryptoVdaGains: number; // virtual digital assets (flat 30%, no set-off)
}

/** Business / profession summary for ITR-3 (regular books). Portal carries the full schedules. */
export interface BusinessInfo {
  natureOfBusiness: string;
  grossReceipts: number;
  netProfit: number; // profit as per the profit & loss account
}

/** Presumptive taxation for ITR-4 (sections 44AD / 44ADA / 44AE). */
export interface PresumptiveInfo {
  scheme: "44AD" | "44ADA" | "44AE" | "none";
  turnover: number; // 44AD gross turnover / 44ADA gross receipts
  digitallyReceivedShare: number; // % of turnover received digitally (6% vs 8% presumption)
  declaredProfit: number; // presumptive profit the taxpayer declares
  numVehicles: number; // 44AE — goods-carriage count
}

export interface FilioData {
  version: 1 | 2;
  assessmentYear: string;
  selectedForm: FormId; // which ITR the session is preparing
  eligibility: EligibilityAnswers;
  eligibilityConfirmed: boolean;
  personal: PersonalInfo;
  salary: SalaryInfo;
  otherIncome: OtherIncomeInfo;
  deductions: DeductionsInfo;
  // Extra schedules used by the wider forms. Shared heads (salary, other sources,
  // deductions) stay above; these only appear when the chosen form needs them.
  houseProperties: HouseProperty[]; // ITR-2 (ITR-1 keeps its simpler single figure)
  capitalGains: CapitalGainsInfo; // ITR-2 / ITR-3
  business: BusinessInfo; // ITR-3
  presumptive: PresumptiveInfo; // ITR-4
  chosenRegime: Regime | null; // null = let Filio recommend the cheaper one
  updatedAt: number;
}

/** The on-disk export file wrapper (a .filio.json the user keeps on their device). */
export interface FilioExportFile {
  app: "filio";
  schema: 1;
  exportedAt: number;
  data: FilioData;
}
