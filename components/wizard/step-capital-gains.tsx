"use client";

import { PiStack } from "react-icons/pi";
import { useFilioStore } from "@/store";
import { MoneyInput } from "@/components/money-input";
import { WhyWeAsk } from "@/components/why-we-ask";

export function StepCapitalGains() {
  const cg = useFilioStore((s) => s.data.capitalGains);
  const setCg = useFilioStore((s) => s.setCapitalGains);

  return (
    <div className="space-y-6">
      <WhyWeAsk>
        Gains from selling shares, funds, property, or crypto are taxed at their own special rates.
        Enter the gain figures; Filio records them and shows an indicative tax.
      </WhyWeAsk>

      <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-soft/70 px-4 py-3 text-sm text-warning">
        <PiStack className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">Finalized on the portal. </span>
          Set-off of losses, indexation, and grandfathering decide the exact taxable gain. Filio
          shows an honest indicative figure, not a final number.
        </span>
      </p>

      <MoneyInput
        id="ltcgEquity112A"
        label="LTCG on listed shares / equity funds (112A)"
        value={cg.ltcgEquity112A}
        onValueChange={(v) => setCg({ ltcgEquity112A: v })}
        hint="Held over a year. First Rs 1.25 lakh is exempt; the balance is taxed at 12.5%."
      />

      <MoneyInput
        id="stcgEquity111A"
        label="STCG on listed shares / equity funds (111A)"
        value={cg.stcgEquity111A}
        onValueChange={(v) => setCg({ stcgEquity111A: v })}
        hint="Held under a year. Taxed at 20% (transfers on or after 23 Jul 2024)."
      />

      <MoneyInput
        id="ltcgOther"
        label="Other long-term gains (property, gold, debt)"
        value={cg.ltcgOther}
        onValueChange={(v) => setCg({ ltcgOther: v })}
        hint="Indexation and the exact rate are applied on the portal."
      />

      <MoneyInput
        id="stcgOther"
        label="Other short-term gains"
        value={cg.stcgOther}
        onValueChange={(v) => setCg({ stcgOther: v })}
        hint="Added to your income and taxed at slab rates."
      />

      <MoneyInput
        id="cryptoVdaGains"
        label="Virtual digital assets (crypto) gains"
        value={cg.cryptoVdaGains}
        onValueChange={(v) => setCg({ cryptoVdaGains: v })}
        hint="Flat 30%, with no set-off and no deductions."
      />
    </div>
  );
}
