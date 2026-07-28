// lib/output/mapping.ts
// Builds the "which number goes in which ITR-1 box" mapping sheet (§9). Pure data —
// no rendering. Values reflect the regime the user is filing under.

import type { FilioData, Regime } from "@/store/types";
import type { ComparisonResult, RegimeResult } from "@/lib/tax-engine/types";
import { formatINR } from "@/lib/utils";
import { buildTaxInput, housePropertyNet, totalTdsPaid } from "@/store";
import { computeForForm } from "@/lib/tax-engine/multi-form";
import { getForm } from "@/lib/tax-engine/forms";

export interface MappingRow {
  box: string; // the ITR-1 field / schedule reference
  label: string;
  value: string;
  note?: string;
}

export interface MappingSection {
  title: string;
  rows: MappingRow[];
}

export interface MappingSheet {
  regime: Regime;
  regimeLabel: string;
  formName: string; // "ITR-1"
  staged: boolean; // true when some heads are finalized on the portal
  sections: MappingSection[];
}

function cap(value: number, limit: number): number {
  return Math.min(Math.max(value, 0), limit);
}

export function buildMappingSheet(data: FilioData, comparison: ComparisonResult): MappingSheet {
  const regime: Regime = data.chosenRegime ?? comparison.cheaper;
  const r: RegimeResult = regime === "new" ? comparison.new : comparison.old;
  const isNew = regime === "new";
  const form = getForm(data.selectedForm);
  const comp = computeForForm(
    data.selectedForm,
    buildTaxInput(data),
    { capitalGains: data.capitalGains, business: data.business, presumptive: data.presumptive },
    data.assessmentYear as "2026-27",
  );

  const { personal, salary, otherIncome, deductions, foreignIncome } = data;
  const totalInterest =
    otherIncome.savingsInterest + otherIncome.depositInterest + otherIncome.otherInterest;
  const grossSalary = salary.grossSalary;
  const netSalary = Math.max(grossSalary - r.standardDeduction, 0);
  const otherSources = totalInterest + salary.familyPension;
  const tds = totalTdsPaid(data);
  const balance = r.totalTax - tds;

  const sections: MappingSection[] = [];

  sections.push({
    title: "Part A - Personal information",
    rows: [
      { box: "A1 PAN", label: "PAN", value: personal.pan || "Not provided" },
      { box: "A2 Name", label: "Name", value: personal.fullName || "Not provided" },
      { box: "A3 Date of birth", label: "Date of birth", value: personal.dob || "Not provided" },
      {
        box: "Filing status",
        label: "Tax regime",
        value: isNew ? "New regime (default u/s 115BAC)" : "Old regime (opting out of 115BAC)",
        note: isNew
          ? "On the portal, keep the default new regime."
          : "On the portal, choose to opt out of the new regime to use the old regime.",
      },
    ],
  });

  sections.push({
    title: "Part B - Gross total income",
    rows: [
      { box: "B1 (i) Gross salary/pension", label: "Gross salary / pension", value: formatINR(grossSalary) },
      {
        box: "B1 standard deduction",
        label: "Standard deduction",
        value: formatINR(r.standardDeduction),
        note: isNew ? "₹75,000 under the new regime." : "₹50,000 under the old regime.",
      },
      { box: "B1 Net salary", label: "Income from salary/pension", value: formatINR(netSalary) },
      {
        box: "B2 House property",
        label: "Income from house property",
        value: formatINR(housePropertyNet(data)),
        note:
          housePropertyNet(data) < 0 && isNew
            ? "A house-property loss can't be set off in the new regime."
            : undefined,
      },
      {
        box: "B3 Other sources",
        label: "Income from other sources",
        value: formatINR(otherSources),
        note: "Interest income" + (salary.familyPension > 0 ? " and family pension." : "."),
      },
      { box: "B4 Gross total income", label: "Gross total income", value: formatINR(r.grossTotalIncome) },
    ],
  });

  const deductionRows: MappingRow[] = [];
  if (isNew) {
    deductionRows.push({
      box: "80CCD(2)",
      label: "Employer NPS contribution",
      value: formatINR(cap(deductions.employerNps80CCD2, deductions.employerNps80CCD2)),
      note: "The only Chapter VI-A deduction allowed in the new regime.",
    });
  } else {
    const c80D_self = cap(deductions.section80D_self, personal.ageBand === "below60" ? 25000 : 50000);
    const c80D_parents = cap(deductions.section80D_parents, deductions.parentsAreSenior ? 50000 : 25000);
    const ttbCap = personal.ageBand === "below60" ? 10000 : 50000;
    const ttbBase = personal.ageBand === "below60" ? otherIncome.savingsInterest : totalInterest;
    deductionRows.push(
      { box: "80C", label: "80C investments", value: formatINR(cap(deductions.section80C, 150000)) },
      { box: "80CCD(1B)", label: "Additional NPS (self)", value: formatINR(cap(deductions.section80CCD1B, 50000)) },
      { box: "80CCD(2)", label: "Employer NPS", value: formatINR(deductions.employerNps80CCD2) },
      { box: "80D", label: "Health insurance (self)", value: formatINR(c80D_self) },
      { box: "80D", label: "Health insurance (parents)", value: formatINR(c80D_parents) },
      {
        box: personal.ageBand === "below60" ? "80TTA" : "80TTB",
        label: personal.ageBand === "below60" ? "Savings interest (80TTA)" : "Interest income (80TTB)",
        value: formatINR(cap(ttbBase, ttbCap)),
      },
    );
  }
  deductionRows.push({
    box: "Part C total",
    label: "Total deductions (Chapter VI-A)",
    value: formatINR(r.chapterVIADeductions),
  });

  sections.push({ title: "Part C - Deductions", rows: deductionRows });

  sections.push({
    title: "Part D - Tax computation",
    rows: [
      { box: "Total income", label: "Total taxable income", value: formatINR(r.taxableIncome) },
      { box: "Tax on total income", label: "Tax before rebate", value: formatINR(r.slabTax) },
      { box: "Rebate u/s 87A", label: "87A rebate", value: formatINR(r.rebate87A) },
      ...(r.marginalRelief > 0
        ? [{ box: "Marginal relief", label: "Marginal relief", value: formatINR(r.marginalRelief) }]
        : []),
      ...(r.ltcgTax > 0
        ? [{ box: "Tax on LTCG (112A)", label: "LTCG tax @12.5%", value: formatINR(r.ltcgTax) }]
        : []),
      { box: "Health & education cess", label: "Cess @4%", value: formatINR(r.cess) },
      { box: "Total tax liability", label: "Total tax", value: formatINR(r.totalTax) },
      { box: "Total taxes paid (TDS)", label: "TDS already paid", value: formatINR(tds) },
      balance > 0
        ? { box: "Balance tax payable", label: "Tax still to pay", value: formatINR(balance) }
        : balance < 0
          ? { box: "Refund", label: "Refund due to you", value: formatINR(-balance) }
          : { box: "Balance", label: "Nothing to pay or refund", value: formatINR(0) },
    ],
  });

  // Heads Filio does not compute itself (capital gains, business, presumptive): reported
  // honestly with a clear "finalized on the portal" note, never folded into the total above.
  if (comp.staged && comp.stagedHeads.length > 0) {
    sections.push({
      title: "Schedule - finalized on the portal",
      rows: comp.stagedHeads.map((h) => ({
        box: "Portal schedule",
        label: h.label,
        value: formatINR(h.amount),
        note:
          h.indicativeTax != null
            ? `Indicative tax ${formatINR(h.indicativeTax)}. ${h.note}`
            : h.note,
      })),
    });
  }

  if (foreignIncome.incomeEntries.length > 0) {
    sections.push({
      title: "Schedule FSI / TR - foreign-source income and relief",
      rows: foreignIncome.incomeEntries.flatMap((entry, index) => [
        {
          box: `FSI row ${index + 1}`,
          label: `${entry.incomeHead} · country ISD ${entry.countryCode || "not set"}`,
          value: formatINR(entry.grossIncomeInr),
          note: `TIN/passport ${entry.tinOrPassport || "not set"}. Also report this under its normal income head.`,
        },
        {
          box: `TR row ${index + 1}`,
          label: `Foreign tax relief · section ${entry.reliefSection}`,
          value: formatINR(entry.reliefClaimedInr),
          note: `Foreign tax paid ${formatINR(entry.foreignTaxPaidInr)}${entry.dtaaArticle ? ` · ${entry.dtaaArticle}` : ""}.`,
        },
      ]),
    });
  }

  if (foreignIncome.assetEntries.length > 0) {
    sections.push({
      title: "Schedule FA - foreign assets working paper",
      rows: foreignIncome.assetEntries.map((entry, index) => ({
        box: `FA row ${index + 1}`,
        label: `${entry.assetType} · ${entry.institutionOrAsset || "Description not set"}`,
        value: `Peak ${formatINR(entry.peakValueInr)} · Closing ${formatINR(entry.closingValueInr)}`,
        note: `Country ISD ${entry.countryCode || "not set"} · Income ${formatINR(entry.grossIncomeInr)} · Proceeds ${formatINR(entry.saleProceedsInr)}.`,
      })),
    });
  }

  return {
    regime,
    regimeLabel: isNew ? "New regime" : "Old regime",
    formName: form.name,
    staged: comp.staged,
    sections,
  };
}
