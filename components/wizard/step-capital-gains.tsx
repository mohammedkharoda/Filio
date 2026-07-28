"use client";

import { PiPlus, PiStack, PiTrash } from "react-icons/pi";
import { useFilioStore } from "@/store";
import type { CapitalGainTransaction } from "@/store/types";
import { classifyCapitalGain } from "@/lib/capital-gains";
import { formatINR } from "@/lib/utils";
import { MoneyInput } from "@/components/money-input";
import { TextField } from "@/components/text-field";
import { WhyWeAsk } from "@/components/why-we-ask";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function newTransaction(): CapitalGainTransaction {
  return {
    id: crypto.randomUUID(),
    entryMode: "single",
    assetType: "listedEquity",
    saleValue: 0,
    saleDate: "",
    purchaseValue: 0,
    purchaseDate: "",
  };
}

export function StepCapitalGains() {
  const cg = useFilioStore((s) => s.data.capitalGains);
  const setCg = useFilioStore((s) => s.setCapitalGains);
  const transactions = cg.transactions ?? [];

  const update = (id: string, patch: Partial<CapitalGainTransaction>) => {
    setCg({ transactions: transactions.map((tx) => (tx.id === id ? { ...tx, ...patch } : tx)) });
  };

  return (
    <div className="space-y-6">
      <WhyWeAsk>
        Enter what you sold and what it cost. Filio calculates the gain or loss and classifies it
        as short- or long-term from the dates.
      </WhyWeAsk>

      <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-soft/70 px-4 py-3 text-sm text-warning">
        <PiStack className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          Use one entry per sale, or a consolidated broker statement row when its transactions
          share the same asset class and dates. Indexation, grandfathering, expenses and loss
          set-off are still finalized on the portal.
        </span>
      </p>

      {transactions.map((tx, index) => {
        const result = classifyCapitalGain(tx);
        return (
          <section key={tx.id} className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold">Sale entry {index + 1}</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCg({ transactions: transactions.filter((item) => item.id !== tx.id) })}
                aria-label={`Remove sale entry ${index + 1}`}
              >
                <PiTrash /> Remove
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor={`${tx.id}-mode`}>Entry type</Label>
                <select
                  id={`${tx.id}-mode`}
                  className="h-12 rounded-lg border border-input bg-background px-4 text-sm font-medium"
                  value={tx.entryMode}
                  onChange={(e) =>
                    update(tx.id, { entryMode: e.target.value as CapitalGainTransaction["entryMode"] })
                  }
                >
                  <option value="single">Single sale</option>
                  <option value="consolidated">Consolidated entry</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`${tx.id}-asset`}>Asset class</Label>
                <select
                  id={`${tx.id}-asset`}
                  className="h-12 rounded-lg border border-input bg-background px-4 text-sm font-medium"
                  value={tx.assetType}
                  onChange={(e) =>
                    update(tx.id, { assetType: e.target.value as CapitalGainTransaction["assetType"] })
                  }
                >
                  <option value="listedEquity">Listed shares / equity mutual fund</option>
                  <option value="other">Property, gold, unlisted shares or other 24-month asset</option>
                  <option value="specifiedDebtFund">
                    Specified debt fund bought on/after 1 Apr 2023 / market-linked debenture
                  </option>
                </select>
              </div>
              <MoneyInput
                id={`${tx.id}-sale-value`}
                label="Sales value"
                value={tx.saleValue}
                onValueChange={(saleValue) => update(tx.id, { saleValue })}
              />
              <TextField
                id={`${tx.id}-sale-date`}
                label="Sales date"
                type="date"
                min="2025-04-01"
                max="2026-03-31"
                value={tx.saleDate}
                onChange={(e) => update(tx.id, { saleDate: e.target.value })}
                hint="For this return: 1 Apr 2025 to 31 Mar 2026."
              />
              <MoneyInput
                id={`${tx.id}-purchase-value`}
                label="Purchase value"
                value={tx.purchaseValue}
                onValueChange={(purchaseValue) => update(tx.id, { purchaseValue })}
              />
              <TextField
                id={`${tx.id}-purchase-date`}
                label="Purchase date"
                type="date"
                max={tx.saleDate || "2026-03-30"}
                value={tx.purchaseDate}
                onChange={(e) => update(tx.id, { purchaseDate: e.target.value })}
              />
            </div>

            <div className={`rounded-xl px-4 py-3 text-sm ${result.valid ? "bg-secondary" : "bg-muted"}`}>
              <span className="font-semibold">
                {result.gain < 0 ? "Calculated loss" : "Calculated gain"}:{" "}
                {formatINR(Math.abs(result.gain))}
              </span>
              <span className="text-muted-foreground"> · {result.message}</span>
            </div>
          </section>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={() => setCg({ transactions: [...transactions, newTransaction()] })}
      >
        <PiPlus /> Add sale entry
      </Button>

      <MoneyInput
        id="cryptoVdaGains"
        label="Virtual digital assets (crypto) net gains"
        value={cg.cryptoVdaGains}
        onValueChange={(cryptoVdaGains) => setCg({ cryptoVdaGains })}
        hint="Crypto follows separate rules, so it is kept outside the sale classifier."
      />
    </div>
  );
}
