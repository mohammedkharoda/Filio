// content/glossary.ts
// Plain-language explanations for every tax term Filio uses (§10). Each entry powers
// inline tooltips and the help panel. Keep every `short` to a single calm sentence.

export interface GlossaryEntry {
  term: string;
  short: string;
  long?: string;
  category: GlossaryCategory;
}

export type GlossaryCategory = "basics" | "income" | "tax" | "deductions";

export const GLOSSARY: Record<string, GlossaryEntry> = {
  itr1: {
    category: "income",
    term: "ITR-1 (Sahaj)",
    short:
      "The simplest income tax return form, for resident individuals with salary/pension and simple income.",
    long: "ITR-1, also called Sahaj, is meant for people with straightforward finances: salary or pension, a little interest income, up to two houses, and total income up to ₹50 lakh.",
  },
  assessmentYear: {
    category: "basics",
    term: "Assessment Year (AY)",
    short: "The year in which you file tax on the income you earned the previous year.",
    long: "For income earned between 1 April 2025 and 31 March 2026 (Financial Year 2025-26), the Assessment Year is 2026-27.",
  },
  financialYear: {
    category: "basics",
    term: "Financial Year (FY)",
    short: "The year in which you actually earned the income, from 1 April to 31 March.",
  },
  pan: {
    category: "basics",
    term: "PAN",
    short: "Your 10-character Permanent Account Number, your unique tax ID.",
  },
  tan: {
    category: "basics",
    term: "TAN",
    short: "The Tax Deduction Account Number of the employer or bank that deducted tax for you.",
  },
  form16: {
    category: "basics",
    term: "Form 16",
    short: "The certificate your employer gives you showing your salary and the tax they deducted.",
    long: "Form 16 has two parts: Part A (tax deducted and deposited) and Part B (a detailed salary breakup). Filio can read it in your browser to pre-fill numbers.",
  },
  tds: {
    category: "basics",
    term: "TDS",
    short: "Tax Deducted at Source. Tax already taken out of your salary or interest before you got paid.",
    long: "TDS is a prepayment of your tax. If your total TDS is more than your final tax, you get a refund; if less, you pay the balance.",
  },
  grossTotalIncome: {
    category: "income",
    term: "Gross Total Income",
    short: "The sum of all your income before subtracting any deductions.",
  },
  standardDeduction: {
    category: "tax",
    term: "Standard Deduction",
    short: "A flat amount subtracted from salary or pension, with no proof or bills needed.",
    long: "For AY 2026-27 it is ₹75,000 under the new regime and ₹50,000 under the old regime.",
  },
  newRegime: {
    category: "tax",
    term: "New Tax Regime",
    short: "The default system with lower slab rates but very few deductions.",
    long: "Under Section 115BAC, the new regime is the default. It has a higher standard deduction (₹75,000) and a bigger 87A rebate, but you cannot claim 80C, 80D, HRA, etc.",
  },
  oldRegime: {
    category: "tax",
    term: "Old Tax Regime",
    short: "The traditional system with higher rates but many deductions like 80C and 80D.",
    long: "The old regime rewards investments and insurance. It can be cheaper if you claim large deductions. Filio compares both for you.",
  },
  rebate87A: {
    category: "tax",
    term: "Section 87A Rebate",
    short: "A rebate that can reduce your tax to zero if your taxable income is within a limit.",
    long: "New regime: full rebate up to ₹12 lakh taxable income (max ₹60,000). Old regime: up to ₹5 lakh taxable income (max ₹12,500).",
  },
  marginalRelief: {
    category: "tax",
    term: "Marginal Relief",
    short: "A cushion so that earning slightly above the rebate limit doesn't spike your tax.",
    long: "Just above ₹12 lakh in the new regime, your tax is capped at the amount by which your income exceeds ₹12 lakh, instead of jumping to the full slab tax.",
  },
  section80C: {
    category: "deductions",
    term: "Section 80C",
    short: "Deduction up to ₹1.5 lakh for investments like PPF, ELSS, LIC, EPF, and home-loan principal.",
  },
  section80CCD1B: {
    category: "deductions",
    term: "Section 80CCD(1B)",
    short: "An extra ₹50,000 deduction for your own NPS contribution, over and above 80C.",
  },
  section80CCD2: {
    category: "deductions",
    term: "Section 80CCD(2)",
    short: "Deduction for your employer's contribution to your NPS, allowed in both regimes.",
  },
  section80D: {
    category: "deductions",
    term: "Section 80D",
    short: "Deduction for health insurance premiums for yourself, family, and parents.",
    long: "Up to ₹25,000 for self/family (₹50,000 if you are a senior citizen), plus up to ₹25,000 for parents (₹50,000 if they are seniors).",
  },
  section80TTA: {
    category: "deductions",
    term: "Section 80TTA",
    short: "Deduction up to ₹10,000 on savings-account interest (for people under 60).",
  },
  section80TTB: {
    category: "deductions",
    term: "Section 80TTB",
    short: "Deduction up to ₹50,000 on interest income for senior citizens (60+).",
  },
  cess: {
    category: "tax",
    term: "Health & Education Cess",
    short: "An extra 4% added on top of your income tax, funding health and education.",
  },
  basicExemption: {
    category: "tax",
    term: "Basic Exemption Limit",
    short: "The income below which you pay no tax at all.",
    long: "New regime: ₹4 lakh for everyone. Old regime: ₹2.5 lakh (under 60), ₹3 lakh (60-80), ₹5 lakh (80+).",
  },
  ltcg112A: {
    category: "income",
    term: "LTCG under Section 112A",
    short: "Long-term gains on listed shares/equity mutual funds; the first ₹1.25 lakh is tax-free.",
    long: "For ITR-1 these gains must be ₹1.25 lakh or less. The first ₹1.25 lakh is exempt, so within ITR-1 they add no tax.",
  },
  housePropertyIncome: {
    category: "income",
    term: "House Property Income",
    short: "Rent you earn from property, minus allowed costs and home-loan interest.",
    long: "A self-occupied home usually shows a loss (from home-loan interest). ITR-1 allows up to two house properties.",
  },
  resident: {
    category: "basics",
    term: "Resident (and Ordinarily Resident)",
    short: "Someone who lived in India long enough during the year to be taxed as a resident.",
  },
  chapterVIA: {
    category: "deductions",
    term: "Chapter VI-A Deductions",
    short: "The group of deductions (80C, 80D, 80CCD, 80TTA/TTB, etc.) that lower your taxable income.",
  },
  familyPension: {
    category: "income",
    term: "Family Pension",
    short: "Pension received by a family member of a deceased employee; part of it is deductible.",
  },
};

export type GlossaryKey = keyof typeof GLOSSARY;
