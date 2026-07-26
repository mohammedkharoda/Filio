import { describe, expect, it } from "vitest";
import { buildMappingSheet } from "./mapping";
import { computeTax } from "@/lib/tax-engine/engine";
import { buildTaxInput, createDefaultData } from "@/store";

function findRow(sheet: ReturnType<typeof buildMappingSheet>, label: string) {
  for (const section of sheet.sections) {
    const row = section.rows.find((r) => r.label === label);
    if (row) return row;
  }
  return undefined;
}

describe("mapping sheet", () => {
  it("labels the regime and surfaces the total tax", () => {
    const data = createDefaultData();
    data.personal.pan = "ABCDE1234F";
    data.salary.grossSalary = 1275000; // taxable 12L in new regime → tax 0
    data.chosenRegime = "new";

    const result = computeTax(buildTaxInput(data));
    const sheet = buildMappingSheet(data, result);

    expect(sheet.regime).toBe("new");
    expect(sheet.regimeLabel).toBe("New regime");
    expect(findRow(sheet, "Total tax")?.value).toBe("₹0");
    expect(findRow(sheet, "PAN")?.value).toBe("ABCDE1234F");
    expect(findRow(sheet, "Standard deduction")?.value).toBe("₹75,000");
  });

  it("shows a refund when TDS exceeds tax", () => {
    const data = createDefaultData();
    data.salary.grossSalary = 1275000;
    data.salary.tdsOnSalary = 5000;
    data.chosenRegime = "new";
    const result = computeTax(buildTaxInput(data));
    const sheet = buildMappingSheet(data, result);
    expect(findRow(sheet, "Refund due to you")?.value).toBe("₹5,000");
  });

  it("in the new regime only employer NPS appears under deductions", () => {
    const data = createDefaultData();
    data.salary.grossSalary = 900000;
    data.deductions.section80C = 150000; // ignored in new regime
    data.chosenRegime = "new";
    const result = computeTax(buildTaxInput(data));
    const sheet = buildMappingSheet(data, result);
    const partC = sheet.sections.find((s) => s.title.startsWith("Part C"));
    expect(partC?.rows.some((r) => r.label === "80C investments")).toBe(false);
  });
});
