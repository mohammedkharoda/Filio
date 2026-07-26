import type { Metadata } from "next";
import { Suspense } from "react";
import { GlossaryBrowser } from "@/components/glossary-browser";

export const metadata: Metadata = {
  title: "Tax Glossary · Filio",
  description:
    "Searchable, plain-language explanations of the tax terms used across ITR-1, ITR-2, ITR-3, and ITR-4.",
};

export default function GlossaryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-5 py-20 text-center text-muted-foreground">
          Loading glossary…
        </div>
      }
    >
      <GlossaryBrowser />
    </Suspense>
  );
}
