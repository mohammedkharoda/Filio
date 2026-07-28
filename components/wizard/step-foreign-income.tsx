"use client";

import { PiGlobe, PiPlus, PiTrash, PiWarning } from "react-icons/pi";
import { useFilioStore } from "@/store";
import type { ForeignAssetEntry, ForeignIncomeEntry } from "@/store/types";
import { MoneyInput } from "@/components/money-input";
import { TextField } from "@/components/text-field";
import { WhyWeAsk } from "@/components/why-we-ask";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const controlClass = "h-12 rounded-lg border border-input bg-background px-4 text-sm font-medium";

function newIncomeEntry(): ForeignIncomeEntry {
  return {
    id: crypto.randomUUID(),
    countryCode: "",
    tinOrPassport: "",
    incomeHead: "otherSources",
    grossIncomeInr: 0,
    foreignTaxPaidInr: 0,
    reliefClaimedInr: 0,
    reliefSection: "90",
    dtaaArticle: "",
  };
}

function newAssetEntry(): ForeignAssetEntry {
  return {
    id: crypto.randomUUID(),
    assetType: "bank",
    countryCode: "",
    institutionOrAsset: "",
    accountOrAddress: "",
    acquisitionDate: "",
    peakValueInr: 0,
    closingValueInr: 0,
    grossIncomeInr: 0,
    saleProceedsInr: 0,
  };
}

export function StepForeignIncome() {
  const foreign = useFilioStore((s) => s.data.foreignIncome);
  const setForeign = useFilioStore((s) => s.setForeignIncome);
  const setIncomeEntries = useFilioStore((s) => s.setForeignIncomeEntries);
  const setAssetEntries = useFilioStore((s) => s.setForeignAssetEntries);

  const updateIncome = (id: string, patch: Partial<ForeignIncomeEntry>) =>
    setIncomeEntries(foreign.incomeEntries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  const updateAsset = (id: string, patch: Partial<ForeignAssetEntry>) =>
    setAssetEntries(foreign.assetEntries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));

  return (
    <div className="space-y-7">
      <WhyWeAsk>
        Foreign reporting has three connected parts: income by country (FSI), tax relief (TR), and
        foreign assets (FA). These entries create a working paper for the portal.
      </WhyWeAsk>

      <div className="grid gap-2">
        <Label htmlFor="foreign-residential-status">Residential status for the year</Label>
        <select
          id="foreign-residential-status"
          className={controlClass}
          value={foreign.residentialStatus}
          onChange={(e) =>
            setForeign({ residentialStatus: e.target.value as typeof foreign.residentialStatus })
          }
        >
          <option value="ror">Resident and ordinarily resident (ROR)</option>
          <option value="rnor">Resident but not ordinarily resident (RNOR)</option>
          <option value="nr">Non-resident (NR)</option>
        </select>
        <p className="text-sm text-muted-foreground">
          Schedule FA generally applies to ROR filers; FSI availability and taxable scope depend on
          residence. Confirm this status before relying on the entries below.
        </p>
      </div>

      {foreign.residentialStatus !== "ror" ? (
        <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm text-warning">
          <PiWarning className="mt-0.5 shrink-0" />
          You selected {foreign.residentialStatus.toUpperCase()}. Foreign disclosure and taxable
          scope differ from ROR treatment, so have the portal or a tax professional confirm which
          schedules apply.
        </p>
      ) : null}

      <section className="space-y-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold"><PiGlobe /> Foreign-source income and tax relief</h3>
          <p className="text-sm text-muted-foreground">
            Add one row per country and income head. Use INR conversions consistent with the portal.
          </p>
        </div>

        {foreign.incomeEntries.map((entry, index) => (
          <div key={entry.id} className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-bold">FSI entry {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIncomeEntries(foreign.incomeEntries.filter((item) => item.id !== entry.id))}
              >
                <PiTrash /> Remove
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id={`${entry.id}-country`}
                label="Country code (ISD)"
                placeholder="1, 44, 971…"
                value={entry.countryCode}
                onChange={(e) => updateIncome(entry.id, { countryCode: e.target.value.replace(/[^0-9]/g, "") })}
              />
              <TextField
                id={`${entry.id}-tin`}
                label="Foreign TIN (or passport number)"
                value={entry.tinOrPassport}
                onChange={(e) => updateIncome(entry.id, { tinOrPassport: e.target.value })}
              />
              <div className="grid gap-1.5">
                <Label htmlFor={`${entry.id}-head`}>Indian income head</Label>
                <select
                  id={`${entry.id}-head`}
                  className={controlClass}
                  value={entry.incomeHead}
                  onChange={(e) => updateIncome(entry.id, { incomeHead: e.target.value as ForeignIncomeEntry["incomeHead"] })}
                >
                  <option value="salary">Salary</option>
                  <option value="houseProperty">House property</option>
                  <option value="capitalGains">Capital gains</option>
                  <option value="otherSources">Other sources (interest/dividend)</option>
                  <option value="business">Business or profession</option>
                </select>
              </div>
              <MoneyInput
                id={`${entry.id}-gross`}
                label="Foreign-source income (INR)"
                value={entry.grossIncomeInr}
                onValueChange={(grossIncomeInr) => updateIncome(entry.id, { grossIncomeInr })}
              />
              <MoneyInput
                id={`${entry.id}-tax-paid`}
                label="Foreign tax paid (INR)"
                value={entry.foreignTaxPaidInr}
                onValueChange={(foreignTaxPaidInr) => updateIncome(entry.id, { foreignTaxPaidInr })}
              />
              <MoneyInput
                id={`${entry.id}-relief`}
                label="Relief claimed in India (INR)"
                value={entry.reliefClaimedInr}
                onValueChange={(reliefClaimedInr) => updateIncome(entry.id, { reliefClaimedInr })}
                hint="Do not simply copy foreign tax paid; the allowable credit can be lower."
              />
              <div className="grid gap-1.5">
                <Label htmlFor={`${entry.id}-section`}>Relief section</Label>
                <select
                  id={`${entry.id}-section`}
                  className={controlClass}
                  value={entry.reliefSection}
                  onChange={(e) => updateIncome(entry.id, { reliefSection: e.target.value as ForeignIncomeEntry["reliefSection"] })}
                >
                  <option value="90">Section 90 (DTAA)</option>
                  <option value="90A">Section 90A (specified agreement)</option>
                  <option value="91">Section 91 (no DTAA)</option>
                </select>
              </div>
              <TextField
                id={`${entry.id}-article`}
                label="DTAA article (if applicable)"
                placeholder="e.g. Article 11"
                value={entry.dtaaArticle}
                onChange={(e) => updateIncome(entry.id, { dtaaArticle: e.target.value })}
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setIncomeEntries([...foreign.incomeEntries, newIncomeEntry()])}>
          <PiPlus /> Add foreign income
        </Button>
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <div>
          <h3 className="text-lg font-bold">Foreign assets (Schedule FA working paper)</h3>
          <p className="text-sm text-muted-foreground">
            Include accounts and assets even when they produced no income. The portal&apos;s reporting
            period and currency-conversion rules remain authoritative.
          </p>
        </div>
        {foreign.assetEntries.map((entry, index) => (
          <div key={entry.id} className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-bold">FA disclosure {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAssetEntries(foreign.assetEntries.filter((item) => item.id !== entry.id))}
              >
                <PiTrash /> Remove
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor={`${entry.id}-asset-type`}>Asset category</Label>
                <select
                  id={`${entry.id}-asset-type`}
                  className={controlClass}
                  value={entry.assetType}
                  onChange={(e) => updateAsset(entry.id, { assetType: e.target.value as ForeignAssetEntry["assetType"] })}
                >
                  <option value="bank">Foreign bank account</option>
                  <option value="custodial">Custodial / brokerage account</option>
                  <option value="equityDebt">Foreign equity or debt interest</option>
                  <option value="insurance">Cash-value insurance / annuity</option>
                  <option value="financialInterest">Financial interest in an entity</option>
                  <option value="immovable">Immovable property</option>
                  <option value="other">Other foreign asset</option>
                </select>
              </div>
              <TextField
                id={`${entry.id}-asset-country`}
                label="Country code (ISD)"
                value={entry.countryCode}
                onChange={(e) => updateAsset(entry.id, { countryCode: e.target.value.replace(/[^0-9]/g, "") })}
              />
              <TextField
                id={`${entry.id}-institution`}
                label="Institution / asset description"
                value={entry.institutionOrAsset}
                onChange={(e) => updateAsset(entry.id, { institutionOrAsset: e.target.value })}
              />
              <TextField
                id={`${entry.id}-account`}
                label="Account number / address"
                value={entry.accountOrAddress}
                onChange={(e) => updateAsset(entry.id, { accountOrAddress: e.target.value })}
              />
              <TextField
                id={`${entry.id}-acquired`}
                label="Account opening / acquisition date"
                type="date"
                value={entry.acquisitionDate}
                onChange={(e) => updateAsset(entry.id, { acquisitionDate: e.target.value })}
              />
              <MoneyInput
                id={`${entry.id}-peak`}
                label="Peak value / balance (INR)"
                value={entry.peakValueInr}
                onValueChange={(peakValueInr) => updateAsset(entry.id, { peakValueInr })}
              />
              <MoneyInput
                id={`${entry.id}-closing`}
                label="Closing value / balance (INR)"
                value={entry.closingValueInr}
                onValueChange={(closingValueInr) => updateAsset(entry.id, { closingValueInr })}
              />
              <MoneyInput
                id={`${entry.id}-asset-income`}
                label="Gross income from asset (INR)"
                value={entry.grossIncomeInr}
                onValueChange={(grossIncomeInr) => updateAsset(entry.id, { grossIncomeInr })}
              />
              <MoneyInput
                id={`${entry.id}-proceeds`}
                label="Sale / redemption proceeds (INR)"
                value={entry.saleProceedsInr}
                onValueChange={(saleProceedsInr) => updateAsset(entry.id, { saleProceedsInr })}
              />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => setAssetEntries([...foreign.assetEntries, newAssetEntry()])}>
          <PiPlus /> Add foreign asset
        </Button>
      </section>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4">
        <Checkbox
          id="form67"
          checked={foreign.form67Filed}
          onCheckedChange={(checked) => setForeign({ form67Filed: checked === true })}
          className="mt-0.5"
        />
        <span className="text-sm">
          <span className="block font-semibold">Form 67 prepared/filed for foreign tax credit</span>
          Claiming relief in FSI/TR generally also requires Form 67. This checkbox is a reminder,
          not an electronic filing.
        </span>
      </label>
    </div>
  );
}
