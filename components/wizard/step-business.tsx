"use client";

import { PiBriefcase } from "react-icons/pi";
import { useFilioStore } from "@/store";
import { MoneyInput } from "@/components/money-input";
import { TextField } from "@/components/text-field";
import { WhyWeAsk } from "@/components/why-we-ask";

export function StepBusiness() {
  const business = useFilioStore((s) => s.data.business);
  const setBusiness = useFilioStore((s) => s.setBusiness);

  return (
    <div className="space-y-6">
      <WhyWeAsk>
        ITR-3 is for a business or profession kept on regular books. Enter your headline figures;
        the full profit and loss and balance sheet are filled on the portal.
      </WhyWeAsk>

      <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-soft/70 px-4 py-3 text-sm text-warning">
        <PiBriefcase className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">Finalized on the portal. </span>
          Your net profit is added to total income and taxed at slab rates, after depreciation and
          any disallowances. Filio carries the figure; the schedules are completed when you file.
        </span>
      </p>

      <TextField
        id="natureOfBusiness"
        label="Nature of business or profession"
        placeholder="e.g. Software consulting"
        value={business.natureOfBusiness}
        onChange={(e) => setBusiness({ natureOfBusiness: e.target.value })}
      />

      <MoneyInput
        id="grossReceipts"
        label="Gross receipts / turnover"
        value={business.grossReceipts}
        onValueChange={(v) => setBusiness({ grossReceipts: v })}
        hint="Total receipts before expenses."
      />

      <MoneyInput
        id="netProfit"
        label="Net profit (as per your books)"
        value={business.netProfit}
        onValueChange={(v) => setBusiness({ netProfit: v })}
        hint="Profit after expenses, from your profit and loss account."
      />
    </div>
  );
}
