// lib/tax-engine/eligibility.ts
// ITR-1 (Sahaj) eligibility gate for AY 2026-27. Pure functions, fully testable.
// An ineligible user must NOT be allowed to proceed (see §7 of the brief).

export interface EligibilityAnswers {
  // Required-true conditions for ITR-1:
  isIndividual: boolean; // an individual (ITR-1 is not for HUFs)
  isResident: boolean; // resident and ordinarily resident (not NR / RNOR)

  // Any TRUE below disqualifies ITR-1:
  totalIncomeOver50L: boolean;
  hasBusinessOrProfessionIncome: boolean;
  hasShortTermCapitalGains: boolean; // ANY STCG — no threshold
  hasOtherCapitalGains: boolean; // LTCG > ₹1.25L, or any gains other than 112A
  hasCryptoVda: boolean;
  hasForeignIncomeOrAssets: boolean;
  moreThanTwoHouseProperties: boolean;
  isCompanyDirector: boolean;
  holdsUnlistedShares: boolean;
  agriculturalIncomeOver5k: boolean;
}

export interface Disqualifier {
  code: string;
  /** Plain-language explanation of why ITR-1 does not fit. */
  message: string;
  /** Where to go instead. */
  suggestion: string;
}

export interface EligibilityResult {
  eligible: boolean;
  disqualifiers: Disqualifier[];
}

const ITR2 = "This usually means ITR-2. Consider the official portal's help or a tax professional.";
const ITR3_4 =
  "This usually means ITR-3 (business/profession) or ITR-4 (presumptive). A tax professional can confirm.";

/** Blank answers = eligible until a question flags otherwise. */
export function defaultEligibilityAnswers(): EligibilityAnswers {
  return {
    isIndividual: true,
    isResident: true,
    totalIncomeOver50L: false,
    hasBusinessOrProfessionIncome: false,
    hasShortTermCapitalGains: false,
    hasOtherCapitalGains: false,
    hasCryptoVda: false,
    hasForeignIncomeOrAssets: false,
    moreThanTwoHouseProperties: false,
    isCompanyDirector: false,
    holdsUnlistedShares: false,
    agriculturalIncomeOver5k: false,
  };
}

/**
 * Route a filer to the right ITR from the same answers the eligibility gate collects.
 * Instead of blocking a non-ITR-1 filer, Filio recommends the form that fits:
 *   - business / profession income  -> ITR-3 (regular books; ITR-4 offered for presumptive)
 *   - anything else ITR-1 can't hold -> ITR-2
 *   - a clean simple return          -> ITR-1
 * This is a routing helper, not tax advice; the recommender screen explains why.
 */
export function recommendForm(a: EligibilityAnswers): import("@/store/types").FormId {
  if (a.hasBusinessOrProfessionIncome) return "ITR3";

  const beyondItr1 =
    !a.isIndividual ||
    !a.isResident ||
    a.totalIncomeOver50L ||
    a.hasShortTermCapitalGains ||
    a.hasOtherCapitalGains ||
    a.hasCryptoVda ||
    a.hasForeignIncomeOrAssets ||
    a.moreThanTwoHouseProperties ||
    a.isCompanyDirector ||
    a.holdsUnlistedShares ||
    a.agriculturalIncomeOver5k;

  return beyondItr1 ? "ITR2" : "ITR1";
}

/** True when a presumptive return (ITR-4) is a reasonable lighter alternative to ITR-3. */
export function presumptiveAlternative(a: EligibilityAnswers): boolean {
  return (
    a.hasBusinessOrProfessionIncome &&
    a.isIndividual &&
    a.isResident &&
    !a.totalIncomeOver50L &&
    !a.hasOtherCapitalGains &&
    !a.hasShortTermCapitalGains
  );
}

export function checkEligibility(a: EligibilityAnswers): EligibilityResult {
  const d: Disqualifier[] = [];

  if (!a.isIndividual) {
    d.push({
      code: "not_individual",
      message: "ITR-1 (Sahaj) is only for individual taxpayers, not HUFs or other entities.",
      suggestion: ITR3_4,
    });
  }
  if (!a.isResident) {
    d.push({
      code: "not_resident",
      message:
        "ITR-1 is only for someone who is Resident and Ordinarily Resident. Non-residents and RNOR can't use it.",
      suggestion: ITR2,
    });
  }
  if (a.totalIncomeOver50L) {
    d.push({
      code: "income_over_50l",
      message: "ITR-1 is only for total income up to ₹50 lakh. Yours is higher.",
      suggestion: ITR2,
    });
  }
  if (a.hasBusinessOrProfessionIncome) {
    d.push({
      code: "business_income",
      message: "You have income from a business or profession, which ITR-1 doesn't cover.",
      suggestion: ITR3_4,
    });
  }
  if (a.hasShortTermCapitalGains) {
    d.push({
      code: "stcg",
      message:
        "You have short-term capital gains. ITR-1 can't report any short-term capital gains, however small.",
      suggestion: ITR2,
    });
  }
  if (a.hasOtherCapitalGains) {
    d.push({
      code: "other_ltcg",
      message:
        "Your long-term capital gains are above ₹1.25 lakh, or you have gains other than listed-equity/equity-fund (Section 112A). ITR-1 can't handle these.",
      suggestion: ITR2,
    });
  }
  if (a.hasCryptoVda) {
    d.push({
      code: "crypto_vda",
      message: "You have income from crypto or other virtual digital assets, which ITR-1 doesn't support.",
      suggestion: ITR2,
    });
  }
  if (a.hasForeignIncomeOrAssets) {
    d.push({
      code: "foreign",
      message: "You have foreign income or foreign assets. ITR-1 can't be used in that case.",
      suggestion: ITR2,
    });
  }
  if (a.moreThanTwoHouseProperties) {
    d.push({
      code: "houses",
      message: "You own more than two house properties. ITR-1 allows up to two.",
      suggestion: ITR2,
    });
  }
  if (a.isCompanyDirector) {
    d.push({
      code: "director",
      message: "You are a director in a company, which ITR-1 filers can't be.",
      suggestion: ITR2,
    });
  }
  if (a.holdsUnlistedShares) {
    d.push({
      code: "unlisted_shares",
      message: "You held unlisted equity shares during the year, which ITR-1 doesn't allow.",
      suggestion: ITR2,
    });
  }
  if (a.agriculturalIncomeOver5k) {
    d.push({
      code: "agri_over_5k",
      message: "Your agricultural income is more than ₹5,000. ITR-1 allows only up to ₹5,000.",
      suggestion: ITR2,
    });
  }

  return { eligible: d.length === 0, disqualifiers: d };
}
