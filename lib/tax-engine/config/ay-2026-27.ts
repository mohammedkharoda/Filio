// lib/tax-engine/config/ay-2026-27.ts
// Assessment Year 2026-27 (Financial Year 2025-26; income 1 Apr 2025 – 31 Mar 2026).
// Source: Finance Act 2025 / CBDT slabs (verify at incometax.gov.in before release).
// NOTE: ITR-1 requires total income <= ₹50,00,000, so surcharge is NEVER reachable
// for ITR-1 filers. Surcharge bands are included only for engine completeness.

export const AY_2026_27 = {
  assessmentYear: "2026-27",
  financialYear: "2025-26",
  cessRate: 0.04, // 4% Health & Education Cess on (tax − 87A rebate + surcharge)

  // Family pension: deduction is 1/3 of family pension, capped at this amount.
  // Allowed in BOTH regimes.
  familyPensionDeductionCap: 15000,

  // LTCG u/s 112A: first ₹1.25L of gains is exempt; the balance is taxed at a
  // flat special rate (never at slab rates, never eligible for the 87A rebate).
  // Within ITR-1 scope 112A gains are capped at ₹1.25L, so the taxable balance is 0.
  ltcg112A: {
    exemptionLimit: 125000,
    rate: 0.125, // 12.5% on gains transferred on/after 23 Jul 2024
  },

  newRegime: {
    isDefault: true, // default under Section 115BAC
    standardDeduction: 75000, // salary / pension only
    basicExemption: 400000, // same for ALL ages (no senior benefit here)
    // Marginal (band) rates:
    slabs: [
      { upTo: 400000, rate: 0.0 },
      { upTo: 800000, rate: 0.05 },
      { upTo: 1200000, rate: 0.1 },
      { upTo: 1600000, rate: 0.15 },
      { upTo: 2000000, rate: 0.2 },
      { upTo: 2400000, rate: 0.25 },
      { upTo: Infinity, rate: 0.3 },
    ],
    rebate87A: {
      maxTaxableIncome: 1200000, // taxable income ≤ ₹12L → rebate applies
      maxRebate: 60000,
      slabIncomeOnly: true, // NOT on 112A LTCG / other special-rate income
      marginalRelief: true, // see algorithm
    },
    // Deductions allowed under the NEW regime (do NOT allow 80C/80D/HRA here):
    allowedDeductions: [
      "standardDeduction",
      "80CCD(2)_employerNPS",
      "familyPension",
    ],
  },

  oldRegime: {
    isDefault: false,
    standardDeduction: 50000, // salary / pension
    basicExemption: {
      // age-based
      below60: 250000,
      senior60to80: 300000,
      superSenior80plus: 500000,
    },
    // Slabs are applied on income; the age-based exemption sets where 0% ends.
    // For below-60 the effective bands are:
    slabsBelow60: [
      { upTo: 250000, rate: 0.0 },
      { upTo: 500000, rate: 0.05 },
      { upTo: 1000000, rate: 0.2 },
      { upTo: Infinity, rate: 0.3 },
    ],
    // For seniors, raise the 0% ceiling to the age-based exemption, then 5% up to
    // ₹5L, 20% up to ₹10L, 30% above. Built from basicExemption in code.
    rebate87A: { maxTaxableIncome: 500000, maxRebate: 12500, marginalRelief: false },
    deductionLimits: {
      "80C": 150000, // 80C + 80CCC + 80CCD(1) combined cap
      "80CCD(1B)_NPS": 50000, // over and above 80C
      "80D_self_below60": 25000,
      "80D_self_senior": 50000,
      "80D_parents_below60": 25000,
      "80D_parents_senior": 50000,
      "80TTA_savings_below60": 10000,
      "80TTB_interest_senior": 50000,
    },
  },

  // Not reachable within ITR-1 (income ≤ ₹50L); kept for completeness/future forms.
  surcharge: {
    bands: [
      { over: 5000000, rate: 0.1 }, // > ₹50L
      { over: 10000000, rate: 0.15 }, // > ₹1cr
      { over: 20000000, rate: 0.25 }, // > ₹2cr
      { over: 50000000, rate: 0.37 }, // > ₹5cr — OLD regime only
    ],
    newRegimeCap: 0.25, // new regime caps surcharge at 25%
    marginalRelief: true,
  },
} as const;

export type AyConfig = typeof AY_2026_27;

// Registry of available assessment-year configs. Adding a future year is a new file
// plus one line here — the engine reads the active config, no logic changes.
export const AY_CONFIGS = {
  "2026-27": AY_2026_27,
} as const;

export type AssessmentYear = keyof typeof AY_CONFIGS;

export const DEFAULT_ASSESSMENT_YEAR: AssessmentYear = "2026-27";
