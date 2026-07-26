// store/index.ts
// Zustand store for the wizard. Autosaves to IndexedDB (debounced) on every change.

import { create } from "zustand";
import type {
  BusinessInfo,
  CapitalGainsInfo,
  DeductionsInfo,
  FilioData,
  FormId,
  HouseProperty,
  OtherIncomeInfo,
  PersonalInfo,
  PresumptiveInfo,
  Regime,
  SalaryInfo,
} from "./types";
import { defaultEligibilityAnswers, type EligibilityAnswers } from "@/lib/tax-engine/eligibility";
import { DEFAULT_ASSESSMENT_YEAR } from "@/lib/tax-engine/config/ay-2026-27";
import type { TaxInput } from "@/lib/tax-engine/types";
import { loadSession, saveSession } from "@/lib/storage";

export function createDefaultData(): FilioData {
  return {
    version: 2,
    assessmentYear: DEFAULT_ASSESSMENT_YEAR,
    selectedForm: "ITR1",
    eligibility: defaultEligibilityAnswers(),
    eligibilityConfirmed: false,
    personal: {
      pan: "",
      fullName: "",
      dob: "",
      ageBand: "below60",
      residentConfirmed: false,
      email: "",
      mobile: "",
    },
    salary: {
      employerName: "",
      employerTan: "",
      grossSalary: 0,
      isPension: false,
      familyPension: 0,
      tdsOnSalary: 0,
    },
    otherIncome: {
      savingsInterest: 0,
      depositInterest: 0,
      otherInterest: 0,
      housePropertyIncome: 0,
      numHouseProperties: 0,
      ltcg112A: 0,
      otherTds: 0,
    },
    deductions: {
      section80C: 0,
      section80CCD1B: 0,
      section80D_self: 0,
      section80D_parents: 0,
      parentsAreSenior: false,
      employerNps80CCD2: 0,
    },
    houseProperties: [],
    capitalGains: {
      stcgEquity111A: 0,
      stcgOther: 0,
      ltcgEquity112A: 0,
      ltcgOther: 0,
      cryptoVdaGains: 0,
    },
    business: {
      natureOfBusiness: "",
      grossReceipts: 0,
      netProfit: 0,
    },
    presumptive: {
      scheme: "none",
      turnover: 0,
      digitallyReceivedShare: 100,
      declaredProfit: 0,
      numVehicles: 0,
    },
    chosenRegime: null,
    updatedAt: 0,
  };
}

interface FilioStore {
  data: FilioData;
  hydrated: boolean;
  lastSavedAt: number | null;
  hydrate: () => Promise<void>;
  setSelectedForm: (form: FormId) => void;
  setEligibility: (patch: Partial<EligibilityAnswers>) => void;
  confirmEligibility: (confirmed: boolean) => void;
  setPersonal: (patch: Partial<PersonalInfo>) => void;
  setSalary: (patch: Partial<SalaryInfo>) => void;
  setOtherIncome: (patch: Partial<OtherIncomeInfo>) => void;
  setDeductions: (patch: Partial<DeductionsInfo>) => void;
  setHouseProperties: (list: HouseProperty[]) => void;
  setCapitalGains: (patch: Partial<CapitalGainsInfo>) => void;
  setBusiness: (patch: Partial<BusinessInfo>) => void;
  setPresumptive: (patch: Partial<PresumptiveInfo>) => void;
  setChosenRegime: (regime: Regime | null) => void;
  importData: (data: FilioData) => void;
  reset: () => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useFilioStore = create<FilioStore>((set, get) => {
  // Debounced write-through to IndexedDB.
  const scheduleSave = () => {
    if (typeof window === "undefined") return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const snapshot = get().data;
      void saveSession(snapshot).then(() => set({ lastSavedAt: Date.now() }));
    }, 600);
  };

  const mutate = (updater: (d: FilioData) => FilioData) => {
    set((state) => ({ data: { ...updater(state.data), updatedAt: Date.now() } }));
    scheduleSave();
  };

  return {
    data: createDefaultData(),
    hydrated: false,
    lastSavedAt: null,

    hydrate: async () => {
      if (get().hydrated) return;
      const saved = await loadSession();
      if (saved) {
        set({ data: { ...createDefaultData(), ...saved }, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    },

    setSelectedForm: (form) => mutate((d) => ({ ...d, selectedForm: form })),
    setEligibility: (patch) =>
      mutate((d) => ({ ...d, eligibility: { ...d.eligibility, ...patch } })),
    confirmEligibility: (confirmed) => mutate((d) => ({ ...d, eligibilityConfirmed: confirmed })),
    setPersonal: (patch) => mutate((d) => ({ ...d, personal: { ...d.personal, ...patch } })),
    setSalary: (patch) => mutate((d) => ({ ...d, salary: { ...d.salary, ...patch } })),
    setOtherIncome: (patch) =>
      mutate((d) => ({ ...d, otherIncome: { ...d.otherIncome, ...patch } })),
    setDeductions: (patch) => mutate((d) => ({ ...d, deductions: { ...d.deductions, ...patch } })),
    setHouseProperties: (list) => mutate((d) => ({ ...d, houseProperties: list })),
    setCapitalGains: (patch) =>
      mutate((d) => ({ ...d, capitalGains: { ...d.capitalGains, ...patch } })),
    setBusiness: (patch) => mutate((d) => ({ ...d, business: { ...d.business, ...patch } })),
    setPresumptive: (patch) =>
      mutate((d) => ({ ...d, presumptive: { ...d.presumptive, ...patch } })),
    setChosenRegime: (regime) => mutate((d) => ({ ...d, chosenRegime: regime })),

    importData: (data) => {
      set({ data: { ...createDefaultData(), ...data, updatedAt: Date.now() } });
      scheduleSave();
    },

    reset: () => {
      set({ data: createDefaultData(), lastSavedAt: null });
      scheduleSave();
    },
  };
});

/**
 * Net income from house property. When the wider forms capture a detailed list, Filio
 * computes the head (annual value, less 30% standard deduction, less loan interest);
 * ITR-1 keeps its single net figure. Self-occupied interest is capped at Rs 2 lakh.
 */
export function housePropertyNet(data: FilioData): number {
  if (data.houseProperties.length === 0) return data.otherIncome.housePropertyIncome;
  return data.houseProperties.reduce((sum, p) => {
    if (p.kind === "self") {
      return sum - Math.min(Math.max(p.homeLoanInterest, 0), 200000);
    }
    const netAnnualValue = Math.max(p.annualRent - p.municipalTaxes, 0);
    const standardDeduction = netAnnualValue * 0.3;
    return sum + (netAnnualValue - standardDeduction - Math.max(p.homeLoanInterest, 0));
  }, 0);
}

/** Map the collected session onto the tax engine's input shape. */
export function buildTaxInput(data: FilioData): TaxInput {
  const { personal, salary, otherIncome, deductions } = data;
  const totalInterest =
    otherIncome.savingsInterest + otherIncome.depositInterest + otherIncome.otherInterest;

  // 80TTA (below 60) applies to savings interest only; 80TTB (senior) to all interest.
  const section80TTA_TTB =
    personal.ageBand === "below60" ? otherIncome.savingsInterest : totalInterest;

  return {
    ageBand: personal.ageBand,
    salaryIncome: salary.isPension ? 0 : salary.grossSalary,
    pensionIncome: salary.isPension ? salary.grossSalary : 0,
    familyPensionIncome: salary.familyPension,
    housePropertyIncome: housePropertyNet(data),
    otherIncome: totalInterest,
    ltcg112A: otherIncome.ltcg112A,
    deductions: {
      section80C: deductions.section80C,
      section80CCD1B: deductions.section80CCD1B,
      section80D_self: deductions.section80D_self,
      section80D_parents: deductions.section80D_parents,
      parentsAreSenior: deductions.parentsAreSenior,
      section80TTA_TTB,
      employerNps80CCD2: deductions.employerNps80CCD2,
    },
  };
}

/** Total TDS already paid — used to show refund/payable on the summary. */
export function totalTdsPaid(data: FilioData): number {
  return data.salary.tdsOnSalary + data.otherIncome.otherTds;
}
