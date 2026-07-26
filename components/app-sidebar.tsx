"use client";

import * as React from "react";
import Link from "next/link";
import { PiRepeat } from "react-icons/pi";
import { useFilioStore } from "@/store";
import { BrandLogo } from "@/components/brand-logo";
import { getForm } from "@/lib/tax-engine/forms";
import { StepNav, type StepNavItem } from "@/components/wizard/step-nav";
import { DataControls, SaveStatus } from "@/components/data-controls";
import { Badge } from "@/components/ui/badge";

export interface SidebarNav {
  steps: StepNavItem[];
  current: number;
  reviewActive?: boolean;
  onSelectStep?: (index: number) => void;
  onReview?: () => void;
}

/** Interior of the wizard sidebar. Reused in the desktop column and the mobile drawer. */
export function AppSidebar({ nav, idPrefix }: { nav: SidebarNav; idPrefix?: string }) {
  const selectedForm = useFilioStore((s) => s.data.selectedForm);
  const form = getForm(selectedForm);

  return (
    <div className="flex h-full flex-col gap-6">
      <Link href="/" aria-label="Filio home" className="inline-flex">
        <BrandLogo className="h-8 w-auto" />
      </Link>

      <div className="rounded-2xl border border-border/80 bg-card/85 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Preparing</p>
            <p className="font-bold">
              {form.name}
              {form.aka ? <span className="text-muted-foreground"> · {form.aka}</span> : null}
            </p>
          </div>
          {form.status === "beta" ? <Badge variant="beta">Guided</Badge> : <Badge variant="success">Ready</Badge>}
        </div>
        <Link
          href="/forms"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <PiRepeat className="h-3.5 w-3.5" aria-hidden /> Switch form
        </Link>
      </div>

      <StepNav
        items={nav.steps}
        current={nav.current}
        reviewActive={nav.reviewActive}
        onSelect={nav.onSelectStep}
        onReview={nav.onReview}
        idPrefix={idPrefix}
      />

      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <SaveStatus />
        <DataControls />
      </div>
    </div>
  );
}
