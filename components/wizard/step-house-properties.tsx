"use client";

import * as React from "react";
import { PiHouse, PiPlus, PiTrash } from "react-icons/pi";
import { useFilioStore } from "@/store";
import type { HouseProperty } from "@/store/types";
import { MoneyInput } from "@/components/money-input";
import { WhyWeAsk } from "@/components/why-we-ask";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function newProperty(index: number): HouseProperty {
  return {
    label: `Property ${index + 1}`,
    kind: "self",
    annualRent: 0,
    municipalTaxes: 0,
    homeLoanInterest: 0,
  };
}

export function StepHouseProperties() {
  const list = useFilioStore((s) => s.data.houseProperties);
  const setList = useFilioStore((s) => s.setHouseProperties);

  const update = (i: number, patch: Partial<HouseProperty>) =>
    setList(list.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const remove = (i: number) => setList(list.filter((_, idx) => idx !== i));
  const add = () => setList([...list, newProperty(list.length)]);

  return (
    <div className="space-y-6">
      <WhyWeAsk>
        Beyond the two houses ITR-1 allows, each property has its own rent and home-loan interest.
        Filio works out the net income per house (rent, less 30%, less interest) and folds it into
        your tax.
      </WhyWeAsk>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <PiHouse className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="mt-2 font-semibold">No properties added yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a self-occupied home or a let-out property to include it in your return.
          </p>
          <Button className="mt-4" onClick={add}>
            <PiPlus className="h-5 w-5" /> Add a property
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((p, i) => (
            <div key={i} className="space-y-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold">{p.label || `Property ${i + 1}`}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => remove(i)}
                >
                  <PiTrash className="h-4 w-4" /> Remove
                </Button>
              </div>

              <div className="grid gap-2">
                <Label>How is it used?</Label>
                <RadioGroup
                  value={p.kind}
                  onValueChange={(v) => update(i, { kind: v as HouseProperty["kind"] })}
                  className="grid-cols-2"
                >
                  {[
                    { v: "self", label: "Self-occupied" },
                    { v: "letout", label: "Let out (rented)" },
                  ].map((o) => (
                    <label
                      key={o.v}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card p-3 hover:bg-muted/50 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-secondary"
                    >
                      <RadioGroupItem value={o.v} id={`hp-${i}-${o.v}`} />
                      <span className="font-medium">{o.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {p.kind === "letout" && (
                <>
                  <MoneyInput
                    id={`rent-${i}`}
                    label="Annual rent received"
                    value={p.annualRent}
                    onValueChange={(v) => update(i, { annualRent: v })}
                  />
                  <MoneyInput
                    id={`muni-${i}`}
                    label="Municipal taxes paid"
                    value={p.municipalTaxes}
                    onValueChange={(v) => update(i, { municipalTaxes: v })}
                    hint="Only taxes actually paid during the year."
                  />
                </>
              )}

              <MoneyInput
                id={`loan-${i}`}
                label="Home-loan interest paid"
                value={p.homeLoanInterest}
                onValueChange={(v) => update(i, { homeLoanInterest: v })}
                hint={
                  p.kind === "self"
                    ? "Deductible for a self-occupied home, capped at Rs 2 lakh."
                    : "Interest paid on a loan for this property."
                }
              />
            </div>
          ))}

          <Button variant="outline" onClick={add}>
            <PiPlus className="h-5 w-5" /> Add another property
          </Button>
        </div>
      )}
    </div>
  );
}
