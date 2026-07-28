import { describe, expect, it } from "vitest";
import { capitalGainTotals, classifyCapitalGain } from "./capital-gains";
import { createDefaultData } from "@/store";
import type { CapitalGainTransaction } from "@/store/types";

function transaction(patch: Partial<CapitalGainTransaction> = {}): CapitalGainTransaction {
  return {
    id: "sale-1",
    entryMode: "single",
    assetType: "listedEquity",
    saleValue: 150000,
    saleDate: "2025-07-15",
    purchaseValue: 100000,
    purchaseDate: "2024-07-15",
    ...patch,
  };
}

describe("capital gain classification", () => {
  it("classifies listed equity held for more than 12 months as long-term", () => {
    expect(classifyCapitalGain(transaction({ purchaseDate: "2024-07-14" })).term).toBe("long");
  });

  it("classifies listed equity held for no more than 12 months as short-term", () => {
    expect(classifyCapitalGain(transaction()).term).toBe("short");
  });

  it("uses the 24-month rule for other assets", () => {
    expect(classifyCapitalGain(transaction({ assetType: "other", purchaseDate: "2023-07-14" })).term).toBe("long");
    expect(classifyCapitalGain(transaction({ assetType: "other", purchaseDate: "2023-07-15" })).term).toBe("short");
  });

  it("keeps specified debt funds short-term regardless of holding period", () => {
    expect(
      classifyCapitalGain(
        transaction({ assetType: "specifiedDebtFund", purchaseDate: "2020-01-01" }),
      ).term,
    ).toBe("short");
  });

  it("keeps a sale loss as a negative amount in the derived bucket", () => {
    const cg = createDefaultData().capitalGains;
    cg.transactions = [transaction({ saleValue: 80000, purchaseDate: "2024-07-14" })];
    expect(capitalGainTotals(cg).ltcgEquity112A).toBe(-20000);
  });

  it("does not total an entry until both dates are valid", () => {
    const cg = createDefaultData().capitalGains;
    cg.transactions = [transaction({ saleDate: "" })];
    expect(capitalGainTotals(cg).total).toBe(0);
  });
});
