// lib/tax-engine/multi-form.ts
// Form-aware compute layer. ITR-1 is computed EXACTLY by the proven engine. For
// ITR-2/3/4, Filio computes the tax on the heads it fully handles (salary, other
// sources, house property, ITR-1-style deductions, the regime comparison) and reports
// the remaining heads (capital gains, business, presumptive, VDA) as STAGED — with an
// honest indicative figure only for the genuinely flat-rate heads, never a final total.
//
// Filio does NOT invent set-off, indexation, or grandfathering. Those are finalized on
// the portal. This is the correctness guardrail for the wider forms.

import { computeTax } from "./engine";
import { AY_CONFIGS, DEFAULT_ASSESSMENT_YEAR, type AssessmentYear } from "./config/ay-2026-27";
import type { ComparisonResult, TaxInput } from "./types";
import type {
  BusinessInfo,
  CapitalGainsInfo,
  FormId,
  PresumptiveInfo,
} from "@/store/types";
import { capitalGainTotals } from "@/lib/capital-gains";

// Special rates for the flat-rate heads (Finance Act 2025 / post 23 Jul 2024).
// Verify at incometax.gov.in before release; used only for INDICATIVE figures.
const RATE_STCG_111A = 0.2; // listed equity / equity MF, short-term
const RATE_LTCG_112A = 0.125; // listed equity / equity MF, long-term (above Rs 1.25L)
const RATE_VDA = 0.3; // virtual digital assets — flat, no set-off, no deduction

export interface StagedHead {
  key: string;
  label: string;
  amount: number; // the income figure the user entered
  /** Indicative tax where the rate is flat and deterministic; undefined when genuinely staged. */
  indicativeTax?: number;
  note: string;
}

export interface FormComputation {
  form: FormId;
  /** Exact for the heads Filio fully handles (salary / other sources / house / deductions). */
  comparison: ComparisonResult;
  /** true for ITR-2/3/4: the heads below are finalized on the portal. */
  staged: boolean;
  stagedHeads: StagedHead[];
  /** Sum of the indicative special-rate tax, for a ballpark only. */
  indicativeExtraTax: number;
}

export interface FormExtras {
  capitalGains: CapitalGainsInfo;
  business: BusinessInfo;
  presumptive: PresumptiveInfo;
}

function capitalGainsHeads(cg: CapitalGainsInfo, cfg: (typeof AY_CONFIGS)["2026-27"]): StagedHead[] {
  const heads: StagedHead[] = [];
  const exemption = cfg.ltcg112A.exemptionLimit;
  const totals = capitalGainTotals(cg);

  if (totals.ltcgEquity112A !== 0) {
    const taxable = Math.max(totals.ltcgEquity112A - exemption, 0);
    heads.push({
      key: "ltcg112A",
      label: "LTCG on listed equity / equity funds (112A)",
      amount: totals.ltcgEquity112A,
      indicativeTax: taxable * RATE_LTCG_112A,
      note: `First Rs 1.25 lakh is exempt; the balance is taxed at 12.5%. Set-off and grandfathering are applied on the portal.`,
    });
  }
  if (totals.stcgEquity111A !== 0) {
    heads.push({
      key: "stcg111A",
      label: "STCG on listed equity / equity funds (111A)",
      amount: totals.stcgEquity111A,
      indicativeTax: Math.max(totals.stcgEquity111A, 0) * RATE_STCG_111A,
      note: "Taxed at 20% (transfers on or after 23 Jul 2024). Confirmed on the portal.",
    });
  }
  if (totals.stcgOther !== 0) {
    heads.push({
      key: "stcgOther",
      label: "Other short-term capital gains",
      amount: totals.stcgOther,
      note: "Added to total income and taxed at slab rates on the portal.",
    });
  }
  if (totals.ltcgOther !== 0) {
    heads.push({
      key: "ltcgOther",
      label: "Other long-term capital gains (property, debt, etc.)",
      amount: totals.ltcgOther,
      note: "Indexation and set-off decide the taxable amount. Finalized on the portal.",
    });
  }
  if (totals.cryptoVdaGains > 0) {
    heads.push({
      key: "vda",
      label: "Virtual digital assets (crypto)",
      amount: totals.cryptoVdaGains,
      indicativeTax: totals.cryptoVdaGains * RATE_VDA,
      note: "Flat 30%, with no set-off and no deductions. Confirmed on the portal.",
    });
  }
  return heads;
}

/**
 * Compute a return for any of the four forms. `input` carries the ITR-1-style heads;
 * `extras` carries the wider-form schedules that are reported and staged, not taxed here.
 */
export function computeForForm(
  form: FormId,
  input: TaxInput,
  extras: FormExtras,
  ay: AssessmentYear = DEFAULT_ASSESSMENT_YEAR,
): FormComputation {
  const cfg = AY_CONFIGS[ay];
  const comparison = computeTax(input, ay);

  if (form === "ITR1") {
    return { form, comparison, staged: false, stagedHeads: [], indicativeExtraTax: 0 };
  }

  const stagedHeads: StagedHead[] = [];

  if (form === "ITR2" || form === "ITR3") {
    stagedHeads.push(...capitalGainsHeads(extras.capitalGains, cfg));
  }
  if (form === "ITR3" && extras.business.netProfit !== 0) {
    stagedHeads.push({
      key: "business",
      label: "Business / profession profit",
      amount: extras.business.netProfit,
      note: "Added to total income and taxed at slab rates on the portal, after your books and disallowances.",
    });
  }
  if (form === "ITR4" && extras.presumptive.declaredProfit > 0) {
    stagedHeads.push({
      key: "presumptive",
      label: "Presumptive income declared",
      amount: extras.presumptive.declaredProfit,
      note: "Added to total income and taxed at slab rates on the portal under the presumptive scheme.",
    });
  }

  const indicativeExtraTax = stagedHeads.reduce((sum, h) => sum + (h.indicativeTax ?? 0), 0);

  return { form, comparison, staged: true, stagedHeads, indicativeExtraTax };
}
