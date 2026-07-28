// lib/tax-engine/engine.ts
// Deterministic, pure-function ITR-1 tax engine. ALL tax logic lives here.
// Computes BOTH regimes for AY 2026-27 and flags the cheaper one.
// See §6b of the brief for the algorithm this implements exactly.

import {
  AY_CONFIGS,
  DEFAULT_ASSESSMENT_YEAR,
  type AssessmentYear,
} from "./config/ay-2026-27";
import type {
  AgeBand,
  ComparisonResult,
  Deductions,
  Regime,
  RegimeResult,
  SlabRow,
  TaxInput,
} from "./types";

// Max house-property loss that may be set off against other heads (s.71(3A)).
const HOUSE_PROPERTY_LOSS_CAP = 200000;

interface Slab {
  upTo: number;
  rate: number;
}

/** Round to the nearest ₹10 (Income-tax Act s.288A / s.288B). */
function roundToTen(n: number): number {
  return Math.round(n / 10) * 10;
}

function nonNeg(n: number): number {
  return n > 0 ? n : 0;
}

/** Marginal band tax with a per-band breakdown for display. */
function computeSlabTax(
  income: number,
  slabs: readonly Slab[],
): { tax: number; rows: SlabRow[] } {
  let tax = 0;
  let prev = 0;
  const rows: SlabRow[] = [];
  for (const slab of slabs) {
    if (income <= prev) break;
    const upper = Math.min(income, slab.upTo);
    const taxableInBand = upper - prev;
    const taxInBand = taxableInBand * slab.rate;
    tax += taxInBand;
    rows.push({
      from: prev,
      to: slab.upTo,
      rate: slab.rate,
      taxableInBand,
      taxInBand,
    });
    prev = slab.upTo;
  }
  return { tax, rows };
}

/**
 * Old-regime slabs derived from the age-based basic exemption: 0% up to the
 * exemption, 5% up to ₹5L, 20% up to ₹10L, 30% above. The 5% band vanishes for
 * super-seniors (exemption already ₹5L).
 */
function buildOldSlabs(exemption: number): Slab[] {
  const slabs: Slab[] = [{ upTo: exemption, rate: 0 }];
  if (exemption < 500000) slabs.push({ upTo: 500000, rate: 0.05 });
  slabs.push({ upTo: 1000000, rate: 0.2 });
  slabs.push({ upTo: Infinity, rate: 0.3 });
  return slabs;
}

function oldExemptionFor(age: AgeBand, cfg: typeof AY_CONFIGS["2026-27"]): number {
  const e = cfg.oldRegime.basicExemption;
  if (age === "superSenior80plus") return e.superSenior80plus;
  if (age === "senior60to80") return e.senior60to80;
  return e.below60;
}

/**
 * Surcharge is never reachable within ITR-1 (total income ≤ ₹50L), so this returns
 * 0 in scope. Bands/new-regime cap are honoured for completeness; marginal relief
 * on surcharge is intentionally omitted because it can never trigger here.
 */
function computeSurcharge(
  baseTax: number,
  totalIncome: number,
  regime: Regime,
  cfg: typeof AY_CONFIGS["2026-27"],
): number {
  let rate = 0;
  for (const band of cfg.surcharge.bands) {
    if (totalIncome > band.over) rate = band.rate;
  }
  if (regime === "new") rate = Math.min(rate, cfg.surcharge.newRegimeCap);
  return baseTax * rate;
}

/** Standard deduction is capped at the salary/pension it is claimed against. */
function standardDeductionFor(input: TaxInput, cap: number): number {
  const basis = input.salaryIncome + input.pensionIncome;
  return basis > 0 ? Math.min(cap, basis) : 0;
}

/** Family-pension deduction: 1/3 of family pension, capped (allowed both regimes). */
function familyPensionDeductionFor(input: TaxInput, cap: number): number {
  if (input.familyPensionIncome <= 0) return 0;
  return Math.min(cap, input.familyPensionIncome / 3);
}

/** 112A: first ₹1.25L exempt; balance taxed at the special rate, never at slab. */
function ltcgFor(
  input: TaxInput,
  cfg: typeof AY_CONFIGS["2026-27"],
): { taxableLtcg: number; ltcgTax: number } {
  const gains = nonNeg(input.ltcg112A);
  const exempt = Math.min(gains, cfg.ltcg112A.exemptionLimit);
  const taxableLtcg = gains - exempt;
  return { taxableLtcg, ltcgTax: taxableLtcg * cfg.ltcg112A.rate };
}

function cappedOldDeductions(d: Deductions, age: AgeBand): number {
  const c80C = Math.min(nonNeg(d.section80C), 150000);
  const c80CCD1B = Math.min(nonNeg(d.section80CCD1B), 50000);
  const c80DSelf = Math.min(nonNeg(d.section80D_self), age === "below60" ? 25000 : 50000);
  const c80DParents = Math.min(nonNeg(d.section80D_parents), d.parentsAreSenior ? 50000 : 25000);
  const c80TT = Math.min(nonNeg(d.section80TTA_TTB), age === "below60" ? 10000 : 50000);
  const employerNps = nonNeg(d.employerNps80CCD2);
  return c80C + c80CCD1B + c80DSelf + c80DParents + c80TT + employerNps;
}

function computeNewRegime(
  input: TaxInput,
  cfg: typeof AY_CONFIGS["2026-27"],
): RegimeResult {
  const nr = cfg.newRegime;
  const sd = standardDeductionFor(input, nr.standardDeduction);
  const fpDed = familyPensionDeductionFor(input, nr.familyPensionDeductionCap);
  const employerNps = nonNeg(input.deductions.employerNps80CCD2);

  // New regime: no set-off of house-property loss against other heads.
  const hp = nonNeg(input.housePropertyIncome);
  const slabIncomeGross =
    input.salaryIncome +
    input.pensionIncome +
    input.familyPensionIncome +
    hp +
    input.otherIncome;

  const { taxableLtcg, ltcgTax } = ltcgFor(input, cfg);
  const totalDeductions = sd + fpDed + employerNps;
  const taxableIncome = roundToTen(nonNeg(slabIncomeGross - totalDeductions));

  const { tax: slabTax, rows: slabBreakdown } = computeSlabTax(taxableIncome, nr.slabs);

  let rebate87A = 0;
  let marginalRelief = 0;
  let taxAfter: number;
  if (taxableIncome <= nr.rebate87A.maxTaxableIncome) {
    rebate87A = Math.min(slabTax, nr.rebate87A.maxRebate);
    taxAfter = slabTax - rebate87A;
  } else {
    // Marginal relief: cap tax at the amount income exceeds ₹12L.
    const excess = taxableIncome - nr.rebate87A.maxTaxableIncome;
    const capped = Math.min(slabTax, excess);
    marginalRelief = slabTax - capped;
    taxAfter = capped;
  }

  const surcharge = computeSurcharge(taxAfter + ltcgTax, taxableIncome + taxableLtcg, "new", cfg);
  const taxBeforeCess = taxAfter + ltcgTax + surcharge;
  const cess = taxBeforeCess * cfg.cessRate;
  const totalTax = roundToTen(taxBeforeCess + cess);

  return {
    regime: "new",
    grossTotalIncome: slabIncomeGross + taxableLtcg,
    standardDeduction: sd,
    familyPensionDeduction: fpDed,
    chapterVIADeductions: employerNps,
    totalDeductions,
    taxableIncome,
    taxableLtcg,
    slabTax,
    rebate87A,
    marginalRelief,
    ltcgTax,
    surcharge,
    taxBeforeCess,
    cess,
    totalTax,
    slabBreakdown,
  };
}

function computeOldRegime(
  input: TaxInput,
  cfg: typeof AY_CONFIGS["2026-27"],
): RegimeResult {
  const or = cfg.oldRegime;
  const sd = standardDeductionFor(input, or.standardDeduction);
  const fpDed = familyPensionDeductionFor(input, or.familyPensionDeductionCap);
  const chapterVIA = cappedOldDeductions(input.deductions, input.ageBand);

  // Old regime: house-property loss set-off capped at ₹2L.
  const hp = Math.max(input.housePropertyIncome, -HOUSE_PROPERTY_LOSS_CAP);
  const slabIncomeGross =
    input.salaryIncome +
    input.pensionIncome +
    input.familyPensionIncome +
    hp +
    input.otherIncome;

  const { taxableLtcg, ltcgTax } = ltcgFor(input, cfg);
  const totalDeductions = sd + fpDed + chapterVIA;
  const taxableIncome = roundToTen(nonNeg(slabIncomeGross - totalDeductions));

  const slabs = buildOldSlabs(oldExemptionFor(input.ageBand, cfg));
  const { tax: slabTax, rows: slabBreakdown } = computeSlabTax(taxableIncome, slabs);

  let rebate87A = 0;
  if (taxableIncome <= or.rebate87A.maxTaxableIncome) {
    rebate87A = Math.min(slabTax, or.rebate87A.maxRebate);
  }
  const taxAfter = slabTax - rebate87A;

  const surcharge = computeSurcharge(taxAfter + ltcgTax, taxableIncome + taxableLtcg, "old", cfg);
  const taxBeforeCess = taxAfter + ltcgTax + surcharge;
  const cess = taxBeforeCess * cfg.cessRate;
  const totalTax = roundToTen(taxBeforeCess + cess);

  return {
    regime: "old",
    grossTotalIncome: slabIncomeGross + taxableLtcg,
    standardDeduction: sd,
    familyPensionDeduction: fpDed,
    chapterVIADeductions: chapterVIA,
    totalDeductions,
    taxableIncome,
    taxableLtcg,
    slabTax,
    rebate87A,
    marginalRelief: 0,
    ltcgTax,
    surcharge,
    taxBeforeCess,
    cess,
    totalTax,
    slabBreakdown,
  };
}

/** Empty deductions helper for callers/tests. */
export function emptyDeductions(): Deductions {
  return {
    section80C: 0,
    section80CCD1B: 0,
    section80D_self: 0,
    section80D_parents: 0,
    parentsAreSenior: false,
    section80TTA_TTB: 0,
    employerNps80CCD2: 0,
  };
}

/** Compute a single regime for the given assessment year. */
export function computeRegime(
  input: TaxInput,
  regime: Regime,
  ay: AssessmentYear = DEFAULT_ASSESSMENT_YEAR,
): RegimeResult {
  const cfg = AY_CONFIGS[ay];
  return regime === "new" ? computeNewRegime(input, cfg) : computeOldRegime(input, cfg);
}

/** Compute both regimes and flag the cheaper one. This is the main entry point. */
export function computeTax(
  input: TaxInput,
  ay: AssessmentYear = DEFAULT_ASSESSMENT_YEAR,
): ComparisonResult {
  const cfg = AY_CONFIGS[ay];
  const oldResult = computeOldRegime(input, cfg);
  const newResult = computeNewRegime(input, cfg);
  // Tie goes to the new regime (the statutory default under s.115BAC).
  const cheaper: Regime = newResult.totalTax <= oldResult.totalTax ? "new" : "old";
  const saving = Math.abs(oldResult.totalTax - newResult.totalTax);
  return {
    assessmentYear: cfg.assessmentYear,
    financialYear: cfg.financialYear,
    old: oldResult,
    new: newResult,
    cheaper,
    saving,
  };
}
