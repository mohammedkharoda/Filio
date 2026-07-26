"use client";

import * as React from "react";
import { PiQuestion, PiMagnifyingGlass } from "react-icons/pi";
import { GLOSSARY } from "@/content/glossary";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Floating help panel: a searchable glossary available on every screen (§10). */
export function HelpPanel() {
  const [query, setQuery] = React.useState("");
  const entries = Object.values(GLOSSARY);
  const filtered = query
    ? entries.filter(
        (e) =>
          e.term.toLowerCase().includes(query.toLowerCase()) ||
          e.short.toLowerCase().includes(query.toLowerCase()),
      )
    : entries;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open help and glossary"
        >
          <PiQuestion className="h-5 w-5" /> Help
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle>Help &amp; glossary</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <PiMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search a term…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="-mx-2 mt-2 max-h-[52vh] overflow-y-auto px-2">
          <dl className="space-y-3">
            {filtered.map((e) => (
              <div key={e.term} className="rounded-xl bg-muted/50 p-3">
                <dt className="font-semibold">{e.term}</dt>
                <dd className="mt-0.5 text-sm text-muted-foreground">{e.short}</dd>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">No terms match “{query}”.</p>
            )}
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
}
