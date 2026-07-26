"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PiArrowLeft, PiCheckCircle, PiDownloadSimple, PiFileText, PiStack } from "react-icons/pi";
import { buildTaxInput, useFilioStore } from "@/store";
import { computeForForm } from "@/lib/tax-engine/multi-form";
import { buildMappingSheet } from "@/lib/output/mapping";
import { downloadSummaryPdf } from "@/lib/output/pdf";
import { getForm } from "@/lib/tax-engine/forms";
import { useHydratedStore } from "@/components/use-hydrated";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataControls } from "@/components/data-controls";
import { DisclaimerBar } from "@/components/disclaimer-bar";

export default function DownloadPage() {
  const hydrated = useHydratedStore();
  const router = useRouter();
  const data = useFilioStore((s) => s.data);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [downloaded, setDownloaded] = React.useState(false);

  const comp = React.useMemo(
    () =>
      computeForForm(
        data.selectedForm,
        buildTaxInput(data),
        { capitalGains: data.capitalGains, business: data.business, presumptive: data.presumptive },
        data.assessmentYear as "2026-27",
      ),
    [data],
  );
  const sheet = React.useMemo(() => buildMappingSheet(data, comp.comparison), [data, comp]);
  const form = getForm(data.selectedForm);

  const nextSteps = [
    "Log in at incometax.gov.in with your PAN and password.",
    "Go to e-File, then Income Tax Returns, then File Income Tax Return.",
    `Pick Assessment Year 2026-27, form ${form.name}, and your chosen regime.`,
    "Copy each value from the sheet below into its matching box, checking any pre-filled data against your own records.",
    comp.staged
      ? "Complete the capital-gains, business, or presumptive schedules on the portal, then review the tax it computes."
      : "Review the tax computation the portal shows, then submit and e-verify to finish.",
  ];

  async function onDownload() {
    setBusy(true);
    setError(null);
    setDownloaded(false);
    try {
      await downloadSummaryPdf(sheet, {
        name: data.personal.fullName,
        pan: data.personal.pan,
        assessmentYear: data.assessmentYear,
      });
      setDownloaded(true);
    } catch {
      setError("Something went wrong building the PDF. Your on-screen sheet below is still complete.");
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) {
    return <div className="mx-auto max-w-3xl px-5 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/" aria-label="Filio home" className="flex">
          <BrandLogo className="h-8 w-auto" />
        </Link>
        <DataControls />
      </header>

      <div className="flex flex-col items-start gap-3">
        <Badge variant={comp.staged ? "beta" : "success"}>
          {comp.staged ? "Ready to file (with portal schedules)" : "Ready to file"}
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight">Your {form.name} summary</h1>
        <p className="text-muted-foreground">
          Filing under the <strong>{sheet.regimeLabel}</strong>. Download the PDF or copy each number
          straight from the mapping sheet into the portal.
        </p>
      </div>

      <div className="mt-4">
        <DisclaimerBar />
      </div>

      {comp.staged && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning-soft/70 p-4">
          <PiStack className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-warning">Some heads are finalized on the portal. </span>
            Filio computed your salary, house property, interest, and deductions exactly. Capital
            gains, business, and presumptive income are listed below as figures to enter, where the
            portal applies set-off and the exact rate.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button size="lg" onClick={onDownload} disabled={busy}>
          {downloaded ? (
            <PiCheckCircle className="h-5 w-5" />
          ) : (
            <PiDownloadSimple className="h-5 w-5" />
          )}
          {busy ? "Preparing…" : downloaded ? "PDF downloaded" : "Download summary PDF"}
        </Button>
        <Button variant="outline" size="lg" onClick={() => window.print()}>
          <PiFileText className="h-5 w-5" /> Print this sheet
        </Button>
      </div>
      {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
      <span className="sr-only" aria-live="polite">
        {downloaded ? "Your PDF summary was downloaded." : ""}
      </span>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Next steps on the official portal</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {nextSteps.map((s, i) => (
              <li key={s} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <h2 className="mt-10 text-2xl font-bold">Field-mapping sheet</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This number goes in this box. Each value below maps to a field on the {form.name} form.
      </p>

      <div className="mt-4 space-y-6">
        {sheet.sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <tbody>
                  {section.rows.map((row, idx) => (
                    <tr key={`${row.box}-${idx}`} className="border-t border-border first:border-t-0">
                      <td className="w-2/5 px-6 py-3 align-top">
                        <p className="font-mono text-xs text-muted-foreground">{row.box}</p>
                        <p className="font-medium">{row.label}</p>
                        {row.note && <p className="mt-0.5 text-xs text-muted-foreground">{row.note}</p>}
                      </td>
                      <td className="px-6 py-3 text-right align-top font-bold tabular-nums">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => router.push("/review")}>
          <PiArrowLeft className="h-5 w-5" /> Back to review
        </Button>
      </div>
    </div>
  );
}
