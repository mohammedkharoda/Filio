import { describe, expect, it } from "vitest";
import { recommendForm, presumptiveAlternative } from "./eligibility";
import { defaultEligibilityAnswers } from "./eligibility";
import { computeForForm } from "./multi-form";
import { buildTaxInput, createDefaultData } from "@/store";

describe("recommendForm", () => {
  it("recommends ITR-1 for a clean simple return", () => {
    expect(recommendForm(defaultEligibilityAnswers())).toBe("ITR1");
  });

  it("recommends ITR-2 for capital gains without business", () => {
    const a = { ...defaultEligibilityAnswers(), hasShortTermCapitalGains: true };
    expect(recommendForm(a)).toBe("ITR2");
  });

  it("recommends ITR-2 for a non-resident", () => {
    const a = { ...defaultEligibilityAnswers(), isResident: false };
    expect(recommendForm(a)).toBe("ITR2");
  });

  it("recommends ITR-3 when there is business income", () => {
    const a = { ...defaultEligibilityAnswers(), hasBusinessOrProfessionIncome: true };
    expect(recommendForm(a)).toBe("ITR3");
  });

  it("offers ITR-4 as a presumptive alternative to a simple business", () => {
    const a = { ...defaultEligibilityAnswers(), hasBusinessOrProfessionIncome: true };
    expect(presumptiveAlternative(a)).toBe(true);
  });

  it("does not offer presumptive when income is over 50L", () => {
    const a = {
      ...defaultEligibilityAnswers(),
      hasBusinessOrProfessionIncome: true,
      totalIncomeOver50L: true,
    };
    expect(presumptiveAlternative(a)).toBe(false);
  });
});

describe("computeForForm", () => {
  it("computes ITR-1 exactly with no staged heads", () => {
    const data = createDefaultData();
    data.salary.grossSalary = 900000;
    const comp = computeForForm("ITR1", buildTaxInput(data), {
      capitalGains: data.capitalGains,
      business: data.business,
      presumptive: data.presumptive,
    });
    expect(comp.staged).toBe(false);
    expect(comp.stagedHeads).toHaveLength(0);
  });

  it("stages capital gains for ITR-2 without folding them into the total", () => {
    const data = createDefaultData();
    data.selectedForm = "ITR2";
    data.salary.grossSalary = 900000;
    data.capitalGains.ltcgEquity112A = 300000; // above the 1.25L exemption

    const input = buildTaxInput(data);
    const withGains = computeForForm("ITR2", input, {
      capitalGains: data.capitalGains,
      business: data.business,
      presumptive: data.presumptive,
    });
    const withoutGains = computeForForm("ITR2", input, {
      capitalGains: createDefaultData().capitalGains,
      business: data.business,
      presumptive: data.presumptive,
    });

    expect(withGains.staged).toBe(true);
    // The core (salary) tax is identical: gains are reported, not folded into the slab total.
    expect(withGains.comparison.new.totalTax).toBe(withoutGains.comparison.new.totalTax);
    const head = withGains.stagedHeads.find((h) => h.key === "ltcg112A");
    expect(head?.amount).toBe(300000);
    // Indicative tax = 12.5% of (300000 - 125000).
    expect(head?.indicativeTax).toBe((300000 - 125000) * 0.125);
  });

  it("stages business profit for ITR-3", () => {
    const data = createDefaultData();
    data.selectedForm = "ITR3";
    data.business.netProfit = 500000;
    const comp = computeForForm("ITR3", buildTaxInput(data), {
      capitalGains: data.capitalGains,
      business: data.business,
      presumptive: data.presumptive,
    });
    expect(comp.stagedHeads.some((h) => h.key === "business")).toBe(true);
  });
});
