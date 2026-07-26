// lib/tax-engine/engine.test.ts
// Verified scenario tests from §6c of the brief. These must be green before any UI.

import { describe, expect, it } from "vitest";
import { computeRegime, computeTax, emptyDeductions } from "./engine";
import type { AgeBand, TaxInput } from "./types";

function makeInput(partial: Partial<TaxInput> = {}): TaxInput {
  return {
    ageBand: "below60" as AgeBand,
    salaryIncome: 0,
    pensionIncome: 0,
    familyPensionIncome: 0,
    housePropertyIncome: 0,
    otherIncome: 0,
    ltcg112A: 0,
    deductions: emptyDeductions(),
    ...partial,
  };
}

describe("New regime — §6c required cases", () => {
  it("taxable ₹12,00,000 → tax ₹0 (full 87A rebate)", () => {
    const r = computeRegime(makeInput({ otherIncome: 1200000 }), "new");
    expect(r.taxableIncome).toBe(1200000);
    expect(r.slabTax).toBe(60000);
    expect(r.rebate87A).toBe(60000);
    expect(r.totalTax).toBe(0);
  });

  it("taxable ₹12,10,000 → slab ₹61,500, marginal relief → ₹10,000 before cess, ₹10,400 after", () => {
    const r = computeRegime(makeInput({ otherIncome: 1210000 }), "new");
    expect(r.taxableIncome).toBe(1210000);
    expect(r.slabTax).toBe(61500);
    expect(r.rebate87A).toBe(0);
    expect(r.marginalRelief).toBe(51500);
    expect(r.taxBeforeCess).toBe(10000);
    expect(r.cess).toBe(400);
    expect(r.totalTax).toBe(10400);
  });

  it("salaried gross ₹12,75,000 → after ₹75,000 standard deduction → taxable ₹12,00,000 → tax ₹0", () => {
    const r = computeRegime(makeInput({ salaryIncome: 1275000 }), "new");
    expect(r.standardDeduction).toBe(75000);
    expect(r.taxableIncome).toBe(1200000);
    expect(r.totalTax).toBe(0);
  });

  it("marginal relief fully phased out by ₹13,00,000 (no relief, tax = full slab + cess)", () => {
    const r = computeRegime(makeInput({ otherIncome: 1300000 }), "new");
    expect(r.slabTax).toBe(75000); // 60000 + 15% of 1,00,000
    expect(r.marginalRelief).toBe(0);
    expect(r.taxBeforeCess).toBe(75000);
    expect(r.totalTax).toBe(78000); // + 4% cess
  });
});

describe("Old regime — §6c required cases", () => {
  it("taxable ₹5,00,000 (below 60) → slab ₹12,500, rebate ₹12,500 → tax ₹0", () => {
    const r = computeRegime(makeInput({ otherIncome: 500000 }), "old");
    expect(r.taxableIncome).toBe(500000);
    expect(r.slabTax).toBe(12500);
    expect(r.rebate87A).toBe(12500);
    expect(r.totalTax).toBe(0);
  });

  it("senior (60-80) gets ₹3,00,000 basic exemption", () => {
    const r = computeRegime(
      makeInput({ ageBand: "senior60to80", otherIncome: 400000 }),
      "old",
    );
    // 0% up to 3L, 5% on next 1L = ₹5,000; ≤5L so rebate wipes it out
    expect(r.slabTax).toBe(5000);
    expect(r.totalTax).toBe(0);
  });

  it("super-senior (80+) gets ₹5,00,000 basic exemption, no 5% band", () => {
    const r = computeRegime(
      makeInput({ ageBand: "superSenior80plus", otherIncome: 700000 }),
      "old",
    );
    // 0% up to 5L, then 20% on 2L = ₹40,000
    expect(r.slabTax).toBe(40000);
    expect(r.totalTax).toBe(41600); // + 4% cess
  });
});

describe("Max 80C / Chapter VI-A case (old regime)", () => {
  it("caps 80C at ₹1.5L and stacks 80CCD(1B), 80D, 80TTA", () => {
    const r = computeRegime(
      makeInput({
        salaryIncome: 1200000,
        otherIncome: 15000, // savings interest
        deductions: {
          ...emptyDeductions(),
          section80C: 200000, // over cap → capped at 1,50,000
          section80CCD1B: 50000,
          section80D_self: 25000,
          section80TTA_TTB: 10000,
        },
      }),
      "old",
    );
    // Chapter VI-A = 150000 + 50000 + 25000 + 10000 = 235000
    expect(r.chapterVIADeductions).toBe(235000);
    // taxable = (1200000 + 15000) − 50000 SD − 235000 = 930000
    expect(r.taxableIncome).toBe(930000);
    // slab: 12500 (5% band) + 20% of 430000 = 86000 → 98500
    expect(r.slabTax).toBe(98500);
    expect(r.totalTax).toBe(102440); // + 4% cess
  });
});

describe("Two house properties", () => {
  it("old regime caps house-property loss set-off at ₹2L; new regime disallows the loss", () => {
    const input = makeInput({ salaryIncome: 800000, housePropertyIncome: -300000 });
    const oldR = computeRegime(input, "old");
    const newR = computeRegime(input, "new");

    // Old: loss capped at −2L → GTI 6,00,000
    expect(oldR.grossTotalIncome).toBe(600000);
    expect(oldR.taxableIncome).toBe(550000); // − 50000 SD
    expect(oldR.slabTax).toBe(22500); // 12500 + 20% of 50000
    expect(oldR.totalTax).toBe(23400);

    // New: loss disallowed → GTI 8,00,000
    expect(newR.grossTotalIncome).toBe(800000);
    expect(newR.taxableIncome).toBe(725000); // − 75000 SD
    expect(newR.totalTax).toBe(0); // rebate wipes it
  });
});

describe("112A LTCG boundary", () => {
  it("exactly ₹1.25L → fully exempt, ₹0 LTCG tax", () => {
    const r = computeRegime(makeInput({ otherIncome: 500000, ltcg112A: 125000 }), "new");
    expect(r.taxableLtcg).toBe(0);
    expect(r.ltcgTax).toBe(0);
    expect(r.totalTax).toBe(0);
  });

  it("above ₹1.25L → balance taxed at 12.5%, never covered by 87A rebate", () => {
    // (out of ITR-1 scope, but the engine must be correct)
    const r = computeRegime(makeInput({ ltcg112A: 225000 }), "new");
    expect(r.taxableLtcg).toBe(100000);
    expect(r.ltcgTax).toBe(12500);
    expect(r.rebate87A).toBe(0); // no slab income → nothing to rebate
    expect(r.totalTax).toBe(13000); // 12500 + 4% cess
  });
});

describe("Comparison", () => {
  it("flags the cheaper regime and reports the saving", () => {
    const c = computeTax(makeInput({ salaryIncome: 1500000 }));
    expect(["old", "new"]).toContain(c.cheaper);
    expect(c.saving).toBe(Math.abs(c.old.totalTax - c.new.totalTax));
    expect(c.assessmentYear).toBe("2026-27");
  });

  it("surcharge is 0 within ITR-1 scope", () => {
    const c = computeTax(makeInput({ salaryIncome: 4900000 }));
    expect(c.old.surcharge).toBe(0);
    expect(c.new.surcharge).toBe(0);
  });
});
