"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  PiBookOpenText,
  PiCalculator,
  PiCheckCircle,
  PiFileText,
  PiListChecks,
  PiMagnifyingGlass,
  PiSparkle,
  PiX,
} from "react-icons/pi";
import type { IconType } from "react-icons";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { GLOSSARY, type GlossaryCategory } from "@/content/glossary";

type CategoryFilter = "all" | GlossaryCategory;

const CATEGORIES: Array<{
  id: CategoryFilter;
  label: string;
  description: string;
  icon: IconType;
}> = [
  { id: "all", label: "All Terms", description: "Everything in one place", icon: PiSparkle },
  { id: "basics", label: "Filing Basics", description: "PAN, TDS, AY & more", icon: PiFileText },
  { id: "income", label: "Income & Forms", description: "Returns and income types", icon: PiBookOpenText },
  { id: "tax", label: "Regimes & Tax", description: "Rates, rebates and cess", icon: PiCalculator },
  { id: "deductions", label: "Deductions", description: "80C, 80D, NPS & more", icon: PiListChecks },
];

const CATEGORY_BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));
const ALL_ENTRIES = Object.entries(GLOSSARY);
const POPULAR_SEARCHES = ["PAN", "TDS", "80C", "New Tax Regime", "Form 16"];

function isCategory(value: string | null): value is CategoryFilter {
  return value === "all" || value === "basics" || value === "income" || value === "tax" || value === "deductions";
}

export function GlossaryBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const query = searchParams.get("q") ?? "";
  const categoryParam = searchParams.get("category");
  const category: CategoryFilter = isCategory(categoryParam) ? categoryParam : "all";
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const filteredEntries = React.useMemo(
    () =>
      ALL_ENTRIES.filter(([, entry]) => {
        if (category !== "all" && entry.category !== category) return false;
        if (!normalizedQuery) return true;
        return `${entry.term} ${entry.short} ${entry.long ?? ""}`
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      }),
    [category, normalizedQuery],
  );

  const updateFilters = React.useCallback(
    (nextQuery: string, nextCategory: CategoryFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextQuery.trim()) params.set("q", nextQuery);
      else params.delete("q");
      if (nextCategory === "all") params.delete("category");
      else params.set("category", nextCategory);
      const suffix = params.toString();
      React.startTransition(() =>
        router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false }),
      );
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 py-12 sm:px-7 sm:py-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-card/90 px-6 py-10 shadow-[0_24px_80px_rgba(99,62,40,0.1)] backdrop-blur-sm sm:px-10 sm:py-14 lg:px-14">
        <motion.span
          aria-hidden
          className="absolute -right-20 -top-28 h-80 w-80 rounded-full border-[44px] border-primary/5"
          animate={reduce ? undefined : { rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground">
            <PiSparkle aria-hidden /> Tax, Translated
          </p>
          <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight sm:text-6xl">
            Understand the term. <span className="text-primary">Keep moving.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Search the tax words you meet while filing and get a plain answer—without opening another tab.
          </p>
        </div>

        <div className="relative mt-8 max-w-3xl">
          <label htmlFor="glossary-search" className="sr-only">Search tax terms</label>
          <div className="group flex min-h-16 items-center rounded-2xl border border-border bg-card pl-5 pr-2 shadow-lg shadow-primary/5 transition-[border-color,box-shadow] focus-within:border-primary/55 focus-within:ring-2 focus-within:ring-primary/15">
            <PiMagnifyingGlass className="h-6 w-6 shrink-0 text-primary" aria-hidden />
            <input
              id="glossary-search"
              name="glossary-search"
              type="search"
              inputMode="search"
              autoComplete="off"
              value={query}
              onChange={(event) => updateFilters(event.target.value, category)}
              placeholder="Search PAN, TDS, deductions…"
              className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base font-medium outline-none placeholder:text-muted-foreground"
            />
            {query ? (
              <button
                type="button"
                onClick={() => updateFilters("", category)}
                aria-label="Clear glossary search"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,color] hover:bg-muted hover:text-foreground"
              >
                <PiX className="h-5 w-5" aria-hidden />
              </button>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-muted-foreground">Popular:</span>
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => updateFilters(term, "all")}
                className="rounded-full border border-border bg-background/70 px-3 py-1.5 font-semibold text-foreground transition-[background-color,border-color,color] hover:border-primary/30 hover:bg-secondary hover:text-secondary-foreground"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16" aria-labelledby="browse-heading">
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Browse by topic</p>
        <h2 id="browse-heading" className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Start Where the Confusion Starts
        </h2>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-5" role="tablist" aria-label="Glossary categories">
          {CATEGORIES.map((item) => {
            const active = item.id === category;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="glossary-results"
                onClick={() => updateFilters(query, item.id)}
                className={`group min-w-0 rounded-2xl border p-4 text-left transition-[transform,background-color,border-color,box-shadow,color] sm:p-5 ${
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                    : "border-border bg-card/80 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-md"
                }`}
              >
                <Icon className={`h-6 w-6 ${active ? "text-primary-foreground" : "text-primary"}`} aria-hidden />
                <span className="mt-3 block truncate font-bold">{item.label}</span>
                <span className={`mt-1 hidden text-xs leading-relaxed sm:block ${active ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">{CATEGORY_BY_ID.get(category)?.label}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">Plain Answers, Right Here</h2>
          </div>
          <p className="text-sm font-semibold text-muted-foreground" aria-live="polite" aria-atomic="true">
            {filteredEntries.length} {filteredEntries.length === 1 ? "term" : "terms"}
          </p>
        </div>

        <div id="glossary-results" role="tabpanel" className="mt-5">
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredEntries.length ? (
              <motion.div layout className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredEntries.map(([key, entry], index) => {
                  const itemCategory = CATEGORY_BY_ID.get(entry.category)!;
                  const Icon = itemCategory.icon;
                  return (
                    <motion.article
                      layout
                      key={key}
                      id={`term-${key}`}
                      initial={reduce ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.22, delay: reduce ? 0 : Math.min(index * 0.025, 0.18) }}
                      className="group flex min-h-64 flex-col overflow-hidden rounded-3xl border border-border/90 bg-card/90 p-6 shadow-[0_10px_36px_rgba(99,62,40,0.06)] backdrop-blur-sm transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-[0_18px_50px_rgba(99,62,40,0.11)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-primary transition-transform group-hover:-rotate-3 group-hover:scale-105">
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                          {itemCategory.label}
                        </span>
                      </div>
                      <h3 className="mt-5 text-balance text-xl font-bold leading-tight">{entry.term}</h3>
                      <p className="mt-3 text-pretty text-sm font-medium leading-relaxed text-foreground/85">{entry.short}</p>
                      {entry.long ? (
                        <div className="mt-auto border-t border-border/70 pt-4">
                          <p className="flex items-start gap-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                            <PiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                            {entry.long}
                          </p>
                        </div>
                      ) : null}
                    </motion.article>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-dashed border-primary/25 bg-card/75 px-6 py-16 text-center"
              >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <PiMagnifyingGlass className="h-7 w-7" aria-hidden />
                </span>
                <h3 className="mt-5 text-xl font-bold">No Matching Term Yet</h3>
                <p className="mx-auto mt-2 max-w-md text-pretty text-sm text-muted-foreground">
                  Try a shorter phrase, browse another topic, or reset the filters to see every explanation.
                </p>
                <button
                  type="button"
                  onClick={() => updateFilters("", "all")}
                  className="mt-5 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground transition-[background-color,transform] hover:bg-primary-strong active:translate-y-px"
                >
                  Show All Terms
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
