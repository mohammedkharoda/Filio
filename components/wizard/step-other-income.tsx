"use client";

import { PiWarning } from "react-icons/pi";
import { useFilioStore } from "@/store";
import { getForm } from "@/lib/tax-engine/forms";
import { MoneyInput } from "@/components/money-input";
import { WhyWeAsk } from "@/components/why-we-ask";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GlossaryTip } from "@/components/glossary-tip";

export function StepOtherIncome() {
  const other = useFilioStore((s) => s.data.otherIncome);
  const setOther = useFilioStore((s) => s.setOtherIncome);
  const selectedForm = useFilioStore((s) => s.data.selectedForm);

  // The wider forms carry house property and capital gains in their own steps, so this
  // step only shows those blocks for the forms that don't (ITR-1, and one house for ITR-4).
  const hasHouseStep = getForm(selectedForm).steps.includes("houseProperties");
  const showHouseHere = !hasHouseStep;
  const showLtcg112A = selectedForm === "ITR1";
  const ltcgOverLimit = other.ltcg112A > 125000;

  return (
    <div className="space-y-6">
      <WhyWeAsk>
        Interest from banks is taxable income too, and it&apos;s easy to forget. A little here can
        change which regime is cheaper.
      </WhyWeAsk>

      <MoneyInput
        id="savingsInterest"
        label="Interest from savings bank accounts"
        value={other.savingsInterest}
        onValueChange={(v) => setOther({ savingsInterest: v })}
        hint={
          <>
            Eligible for <GlossaryTip term="section80TTA" /> /{" "}
            <GlossaryTip term="section80TTB" /> in the old regime.
          </>
        }
      />

      <MoneyInput
        id="depositInterest"
        label="Interest from fixed / recurring deposits"
        value={other.depositInterest}
        onValueChange={(v) => setOther({ depositInterest: v })}
        hint="Include FD/RD interest even if the bank already deducted TDS."
      />

      <MoneyInput
        id="otherInterest"
        label="Other interest (bonds, income-tax refund, etc.)"
        value={other.otherInterest}
        onValueChange={(v) => setOther({ otherInterest: v })}
      />

      {showHouseHere && (
        <>
          <div className="grid gap-2">
            <Label>How many house properties do you have?</Label>
            <RadioGroup
              value={String(other.numHouseProperties)}
              onValueChange={(v) => setOther({ numHouseProperties: Number(v) as 0 | 1 | 2 })}
              className="grid-cols-3"
            >
              {[0, 1, 2].map((n) => (
                <label
                  key={n}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card p-3 hover:bg-muted/50 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-secondary"
                >
                  <RadioGroupItem value={String(n)} id={`hp-${n}`} />
                  <span className="font-medium">{n === 0 ? "None" : n}</span>
                </label>
              ))}
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              This form allows up to two. More than two needs ITR-2.
            </p>
          </div>

          {other.numHouseProperties > 0 && (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <MoneyInput
                id="housePropertyIncome"
                label={<><GlossaryTip term="housePropertyIncome" /> (net amount)</>}
                value={Math.abs(other.housePropertyIncome)}
                onValueChange={(v) =>
                  setOther({ housePropertyIncome: other.housePropertyIncome < 0 ? -v : v })
                }
                hint="Rent received minus 30% standard deduction and home-loan interest. A self-occupied home is usually 0 or a loss."
              />
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <Checkbox
                  checked={other.housePropertyIncome < 0}
                  onCheckedChange={(v) =>
                    setOther({
                      housePropertyIncome:
                        v === true
                          ? -Math.abs(other.housePropertyIncome)
                          : Math.abs(other.housePropertyIncome),
                    })
                  }
                  id="hpLoss"
                />
                <span className="font-medium">
                  This is a loss (home-loan interest is more than the rent)
                </span>
              </label>
              {other.housePropertyIncome < 0 && (
                <p className="text-xs text-muted-foreground">
                  A house-property loss lowers tax in the old regime (set-off capped at Rs 2 lakh).
                  The new regime doesn&apos;t allow this loss.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {showLtcg112A && (
        <>
          <MoneyInput
            id="ltcg112A"
            label={<><GlossaryTip term="ltcg112A" /></>}
            value={other.ltcg112A}
            onValueChange={(v) => setOther({ ltcg112A: v })}
            hint="Long-term gains on listed shares / equity funds. Must be Rs 1,25,000 or less for ITR-1."
          />

          {ltcgOverLimit && (
            <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning">
              <PiWarning className="mt-0.5 h-4 w-4 shrink-0" />
              Gains above Rs 1.25 lakh mean ITR-1 no longer fits. ITR-2 covers this. Please revisit
              the form check.
            </p>
          )}
        </>
      )}

      <MoneyInput
        id="otherTds"
        label={<>TDS deducted on interest / other income</>}
        value={other.otherTds}
        onValueChange={(v) => setOther({ otherTds: v })}
        hint="From Form 26AS / AIS. Counts towards tax you've already paid."
      />
    </div>
  );
}
