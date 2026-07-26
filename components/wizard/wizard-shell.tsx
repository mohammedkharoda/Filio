"use client";

import * as React from "react";
import Link from "next/link";
import { PiCaretUp, PiList } from "react-icons/pi";
import { computeForForm } from "@/lib/tax-engine/multi-form";
import { getForm } from "@/lib/tax-engine/forms";
import { buildTaxInput, totalTdsPaid, useFilioStore } from "@/store";
import { cn, formatINR } from "@/lib/utils";
import { AppSidebar, type SidebarNav } from "@/components/app-sidebar";
import { BrandLogo } from "@/components/brand-logo";
import { TaxPanel } from "@/components/tax-panel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

/**
 * The three-zone filing shell: sidebar (steps) | form | live tax panel.
 * Below xl the tax panel becomes a sticky bottom summary bar; below lg the sidebar
 * becomes a drawer opened from the top bar.
 */
export function WizardShell({ nav, children }: { nav: SidebarNav; children: React.ReactNode }) {
  const [navOpen, setNavOpen] = React.useState(false);

  const drawerNav: SidebarNav = {
    ...nav,
    onSelectStep: nav.onSelectStep
      ? (i) => {
          nav.onSelectStep!(i);
          setNavOpen(false);
        }
      : undefined,
    onReview: nav.onReview
      ? () => {
          nav.onReview!();
          setNavOpen(false);
        }
      : undefined,
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-5 pb-28 sm:px-6 lg:py-8 xl:pb-12">
      {/* Mobile / tablet top bar */}
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <Link href="/" aria-label="Filio home" className="inline-flex">
          <BrandLogo className="h-8 w-auto" />
        </Link>
        <Dialog open={navOpen} onOpenChange={setNavOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <PiList className="h-4 w-4" /> Steps
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-xs overscroll-contain overflow-y-auto">
            <DialogTitle className="sr-only">Steps</DialogTitle>
            <AppSidebar nav={drawerNav} idPrefix="drawer-" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,1fr)_22rem] xl:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <AppSidebar nav={nav} idPrefix="desk-" />
          </div>
        </aside>

        <div className="min-w-0 rounded-3xl border border-border/80 bg-card/80 p-5 shadow-[0_20px_60px_rgba(99,62,40,0.07)] backdrop-blur-sm sm:p-7">
          {children}
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-8">
            <TaxPanel />
          </div>
        </aside>
      </div>

      <MobileTaxBar />
    </div>
  );
}

/** Sticky bottom summary of the live tax, expanding into the full panel. For < xl. */
function MobileTaxBar() {
  const data = useFilioStore((s) => s.data);
  const form = getForm(data.selectedForm);
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
  const chosen = data.chosenRegime ?? comp.comparison.cheaper;
  const chosenResult = chosen === "new" ? comp.comparison.new : comp.comparison.old;
  const balance = chosenResult.totalTax - totalTdsPaid(data);
  const isRefund = balance < 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_30px_rgba(99,62,40,0.1)] backdrop-blur-xl xl:hidden">
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 rounded-lg px-1 py-1 text-left"
          >
            <div>
              <p className="text-xs text-muted-foreground">
                {comp.staged ? "Core tax" : "Total tax"} · {form.name}
              </p>
              <p className="text-lg font-bold tabular-nums">{formatINR(chosenResult.totalTax)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-semibold",
                  balance === 0
                    ? "bg-muted text-muted-foreground"
                    : isRefund
                      ? "bg-success-soft text-success"
                      : "bg-secondary text-secondary-foreground",
                )}
              >
                {balance === 0
                  ? "Settled"
                  : isRefund
                    ? `Refund ${formatINR(-balance)}`
                    : `Pay ${formatINR(balance)}`}
              </span>
              <PiCaretUp className="h-5 w-5 text-muted-foreground" aria-hidden />
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] max-w-md overscroll-contain overflow-y-auto p-0">
          <DialogTitle className="sr-only">Your live tax</DialogTitle>
          <TaxPanel />
        </DialogContent>
      </Dialog>
    </div>
  );
}
