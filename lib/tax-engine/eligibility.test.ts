// lib/tax-engine/eligibility.test.ts
// §7 ITR-1 eligibility — every ineligible case must route away.

import { describe, expect, it } from "vitest";
import {
  checkEligibility,
  defaultEligibilityAnswers,
  type EligibilityAnswers,
} from "./eligibility";

function answers(overrides: Partial<EligibilityAnswers> = {}): EligibilityAnswers {
  return { ...defaultEligibilityAnswers(), ...overrides };
}

describe("Eligible path", () => {
  it("a resident individual within all limits is eligible", () => {
    const r = checkEligibility(answers());
    expect(r.eligible).toBe(true);
    expect(r.disqualifiers).toHaveLength(0);
  });
});

describe("Each §7 disqualifier blocks ITR-1", () => {
  const cases: Array<[keyof EligibilityAnswers | "isIndividual" | "isResident", Partial<EligibilityAnswers>, string]> = [
    ["isIndividual", { isIndividual: false }, "not_individual"],
    ["isResident", { isResident: false }, "not_resident"],
    ["totalIncomeOver50L", { totalIncomeOver50L: true }, "income_over_50l"],
    ["hasBusinessOrProfessionIncome", { hasBusinessOrProfessionIncome: true }, "business_income"],
    ["hasShortTermCapitalGains", { hasShortTermCapitalGains: true }, "stcg"],
    ["hasOtherCapitalGains", { hasOtherCapitalGains: true }, "other_ltcg"],
    ["hasCryptoVda", { hasCryptoVda: true }, "crypto_vda"],
    ["hasForeignIncomeOrAssets", { hasForeignIncomeOrAssets: true }, "foreign"],
    ["moreThanTwoHouseProperties", { moreThanTwoHouseProperties: true }, "houses"],
    ["isCompanyDirector", { isCompanyDirector: true }, "director"],
    ["holdsUnlistedShares", { holdsUnlistedShares: true }, "unlisted_shares"],
    ["agriculturalIncomeOver5k", { agriculturalIncomeOver5k: true }, "agri_over_5k"],
  ];

  it.each(cases)("%s → ineligible with code %s", (_label, override, code) => {
    const r = checkEligibility(answers(override));
    expect(r.eligible).toBe(false);
    expect(r.disqualifiers.map((d) => d.code)).toContain(code);
    // Every disqualifier must carry a kind message and a suggestion.
    for (const d of r.disqualifiers) {
      expect(d.message.length).toBeGreaterThan(0);
      expect(d.suggestion.length).toBeGreaterThan(0);
    }
  });

  it("collects multiple disqualifiers at once", () => {
    const r = checkEligibility(
      answers({ hasShortTermCapitalGains: true, isCompanyDirector: true }),
    );
    expect(r.eligible).toBe(false);
    expect(r.disqualifiers.length).toBeGreaterThanOrEqual(2);
  });
});
