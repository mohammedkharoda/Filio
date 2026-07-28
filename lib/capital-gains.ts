import type { CapitalGainTransaction, CapitalGainsInfo } from "@/store/types";

export type GainTerm = "short" | "long";

export interface ClassifiedGain {
  gain: number;
  term: GainTerm | null;
  valid: boolean;
  message: string;
}

function addMonths(iso: string, months: number): Date {
  const [year = 0, month = 1, day = 1] = iso.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1 + months, day));
  // JS rolls dates such as 31 February forward. Clamp back to the last valid day.
  if (result.getUTCDate() !== day) result.setUTCDate(0);
  return result;
}

/** Classify from the underlying dates: 12 months for listed equity, 24 for other assets. */
export function classifyCapitalGain(tx: CapitalGainTransaction): ClassifiedGain {
  const gain = tx.saleValue - tx.purchaseValue;
  if (!tx.saleDate || !tx.purchaseDate) {
    return { gain, term: null, valid: false, message: "Add both dates to classify the holding period." };
  }
  const purchase = new Date(`${tx.purchaseDate}T00:00:00Z`);
  const sale = new Date(`${tx.saleDate}T00:00:00Z`);
  if (Number.isNaN(purchase.getTime()) || Number.isNaN(sale.getTime()) || sale <= purchase) {
    return { gain, term: null, valid: false, message: "Sale date must be after purchase date." };
  }
  if (tx.assetType === "specifiedDebtFund") {
    return {
      gain,
      term: "short",
      valid: true,
      message: "Short-term under the specified mutual fund / market-linked debenture rule.",
    };
  }
  const months = tx.assetType === "listedEquity" ? 12 : 24;
  const term: GainTerm = sale > addMonths(tx.purchaseDate, months) ? "long" : "short";
  return {
    gain,
    term,
    valid: true,
    message: `${term === "long" ? "Long" : "Short"}-term using the ${months}-month holding rule.`,
  };
}

export interface CapitalGainTotals {
  stcgEquity111A: number;
  stcgOther: number;
  ltcgEquity112A: number;
  ltcgOther: number;
  cryptoVdaGains: number;
  total: number;
}

/** Includes legacy manual totals so old saved sessions remain lossless after migration. */
export function capitalGainTotals(cg: CapitalGainsInfo): CapitalGainTotals {
  const totals: CapitalGainTotals = {
    stcgEquity111A: cg.stcgEquity111A,
    stcgOther: cg.stcgOther,
    ltcgEquity112A: cg.ltcgEquity112A,
    ltcgOther: cg.ltcgOther,
    cryptoVdaGains: cg.cryptoVdaGains,
    total: 0,
  };

  for (const tx of cg.transactions ?? []) {
    const result = classifyCapitalGain(tx);
    if (!result.valid || !result.term) continue;
    if (tx.assetType === "listedEquity") {
      if (result.term === "long") totals.ltcgEquity112A += result.gain;
      else totals.stcgEquity111A += result.gain;
    } else if (result.term === "long") {
      totals.ltcgOther += result.gain;
    } else {
      totals.stcgOther += result.gain;
    }
  }
  totals.total =
    totals.stcgEquity111A +
    totals.stcgOther +
    totals.ltcgEquity112A +
    totals.ltcgOther +
    totals.cryptoVdaGains;
  return totals;
}
