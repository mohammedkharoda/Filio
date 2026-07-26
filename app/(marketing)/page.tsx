"use client";

import * as React from "react";
import Link from "next/link";
import {
  PiArrowRight,
  PiCalculator,
  PiCheck,
  PiClock,
  PiCloudSlash,
  PiCursorClick,
  PiFileArrowDown,
  PiListChecks,
  PiLockKey,
  PiShieldCheck,
  PiSparkle,
  PiTrendDown,
} from "react-icons/pi";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { computeTax } from "@/lib/tax-engine/engine";
import { FORMS, FORM_ORDER } from "@/lib/tax-engine/forms";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrustBadge } from "@/components/trust-badge";

/** A real comparison for a stated example salary. Honest sample, not invented precision. */
const EXAMPLE = computeTax({
  ageBand: "below60",
  salaryIncome: 900000,
  pensionIncome: 0,
  familyPensionIncome: 0,
  housePropertyIncome: 0,
  otherIncome: 18000,
  ltcg112A: 0,
  deductions: {
    section80C: 120000,
    section80CCD1B: 0,
    section80D_self: 18000,
    section80D_parents: 0,
    parentsAreSenior: false,
    section80TTA_TTB: 10000,
    employerNps80CCD2: 0,
  },
});

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** The hero asset: a real mini version of Filio's live tax panel, on example data. */
function HeroPreview() {
  const reduce = useReducedMotion();
  const cheaper = EXAMPLE.cheaper === "new" ? EXAMPLE.new : EXAMPLE.old;
  return (
    <motion.div
      whileHover={reduce ? undefined : { y: -5, rotate: -0.25 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/10"
    >
      <div className="flex items-center justify-between bg-primary px-5 py-4 text-primary-foreground">
        <div>
          <p className="text-xs font-semibold opacity-90">Your total tax</p>
          <p className="text-3xl font-bold tabular-nums tracking-tight">
            {formatINR(cheaper.totalTax)}
          </p>
        </div>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">Example</span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex gap-2">
          {[EXAMPLE.old, EXAMPLE.new].map((r) => {
            const isCheaper = EXAMPLE.cheaper === r.regime;
            return (
              <div
                key={r.regime}
                className={`flex-1 rounded-lg border p-3 ${isCheaper ? "border-success/50 bg-success-soft/60" : "border-border"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold capitalize">{r.regime}</span>
                  {isCheaper && (
                    <Badge variant="success">
                      <PiCheck className="h-3 w-3" /> Cheaper
                    </Badge>
                  )}
                </div>
                <p className="text-lg font-bold tabular-nums">{formatINR(r.totalTax)}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm font-semibold text-success">
          <PiTrendDown className="h-4 w-4" aria-hidden />
          The {EXAMPLE.cheaper} regime saves {formatINR(EXAMPLE.saving)} here.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Example: Rs 9,00,000 salary with 80C and health-insurance deductions.
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
          {["Income", "Deductions", "Regime"].map((label, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0.5 }}
              animate={reduce ? undefined : { opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 2.4, delay: index * 0.35, repeat: Infinity }}
            >
              <span className="mx-auto block h-1.5 w-12 rounded-full bg-primary/20">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${65 + index * 15}%` }} />
              </span>
              <span className="mt-1.5 block text-[11px] font-semibold text-muted-foreground">{label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const HOW = [
  { icon: PiListChecks, title: "Answer", body: "Plain questions, one at a time. Every tax term has a simple explanation." },
  { icon: PiCalculator, title: "Compare", body: "Old and new regime side by side, updating live as you type." },
  { icon: PiFileArrowDown, title: "Export", body: "Download a field-by-field PDF and finish on the official portal yourself." },
];

const TRUST = [
  { icon: PiLockKey, title: "Private by design", body: "Your answers and documents stay on your device. No account, no server." },
  { icon: PiShieldCheck, title: "Honest by design", body: "Filio prepares and explains. It never files for you and promises no refunds." },
  { icon: PiCalculator, title: "Clear by design", body: "Every number is shown. You always see how the tax was worked out." },
];

export default function LandingPage() {
  const reduce = useReducedMotion();
  const [activeForm, setActiveForm] = React.useState<(typeof FORM_ORDER)[number]>("ITR1");
  const selectedForm = FORMS[activeForm];
  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-7">
      {/* Hero: asymmetric split */}
      <section className="relative grid items-center gap-12 overflow-visible pb-14 pt-14 lg:min-h-[36rem] lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:pb-16 lg:pt-20">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-28 top-4 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          animate={reduce ? undefined : { x: [0, -24, 0], y: [0, 18, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <TrustBadge />
          <h1 className="mt-5 max-w-2xl text-balance text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            Your ITR, finally <span className="relative whitespace-nowrap text-primary">made clear.</span>
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Find the right form, compare both tax regimes live, and leave with a field-by-field filing
            summary—all privately in your browser.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/eligibility">
                Find your form <PiArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/forms">Browse all forms</Link>
            </Button>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-2"><PiCheck className="text-success" /> No sign-up</span>
            <span className="inline-flex items-center gap-2"><PiCheck className="text-success" /> All 4 individual ITRs</span>
            <span className="inline-flex items-center gap-2"><PiCheck className="text-success" /> Free to prepare</span>
          </div>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:pl-2"
        >
          <div className="relative">
            <motion.div
              aria-hidden
              className="absolute -left-5 -top-5 z-10 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg"
              animate={reduce ? undefined : { y: [0, -7, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="flex items-center gap-2 text-xs font-bold"><PiSparkle className="text-primary" /> Live comparison</p>
            </motion.div>
            <HeroPreview />
          </div>
        </motion.div>
      </section>

      <Reveal className="grid -translate-y-1 grid-cols-3 overflow-hidden rounded-2xl border border-border/90 bg-card/90 shadow-[0_18px_50px_rgba(99,62,40,0.08)] backdrop-blur-sm">
        {[
          ["4", "individual ITR forms"],
          ["2", "regimes compared live"],
          ["0", "data uploads"],
        ].map(([value, label], index) => (
          <div key={label} className={`px-3 py-5 text-center sm:px-6 ${index ? "border-l border-border" : ""}`}>
            <p className="text-2xl font-extrabold text-primary sm:text-3xl">{value}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground sm:text-sm">{label}</p>
          </div>
        ))}
      </Reveal>

      {/* Interactive form coverage */}
      <section className="py-20" id="forms">
        <Reveal>
          <Badge variant="primary">ITR-1 through ITR-4</Badge>
          <h2 className="mt-4 max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-5xl">One Calm Flow, Whichever Form Fits</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Explore every individual return below. Filio adapts the questions and schedules to the
            form you need—and tells you plainly where the official portal finishes complex tax.
          </p>
        </Reveal>
        <div className="mt-9 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1" role="tablist" aria-label="ITR forms">
            {FORM_ORDER.map((id) => {
              const form = FORMS[id];
              const active = id === activeForm;
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => setActiveForm(id)}
                  role="tab"
                  id={`form-tab-${id}`}
                  aria-selected={active}
                  aria-controls="form-details"
                  className={`group rounded-2xl border p-4 text-left transition-[transform,background-color,border-color,box-shadow,color] sm:p-5 ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                      : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xl font-bold">{form.name}</span>
                    <PiArrowRight className={`transition-transform group-hover:translate-x-1 ${active ? "opacity-100" : "opacity-40"}`} />
                  </span>
                  <span className={`mt-1 block text-xs font-semibold sm:text-sm ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {form.aka || form.tagline.split(".")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            id="form-details"
            role="tabpanel"
            aria-labelledby={`form-tab-${activeForm}`}
            className="relative min-h-[25rem] overflow-hidden rounded-3xl border border-border bg-card/95 p-6 shadow-[0_20px_60px_rgba(99,62,40,0.08)] backdrop-blur-sm sm:p-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeForm}
                initial={reduce ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduce ? undefined : { opacity: 0, x: -20 }}
                transition={{ duration: 0.24 }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Built into Filio</p>
                    <h3 className="mt-1 text-3xl font-bold">{selectedForm.name}{selectedForm.aka ? ` · ${selectedForm.aka}` : ""}</h3>
                  </div>
                  <Badge variant={selectedForm.status === "ready" ? "success" : "beta"}>
                    {selectedForm.status === "ready" ? "Fully computed" : "Guided preparation"}
                  </Badge>
                </div>
                <p className="mt-4 text-lg text-muted-foreground">{selectedForm.tagline}</p>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {selectedForm.who.map((item) => (
                    <li key={item} className="flex items-start gap-2 rounded-xl bg-muted/55 p-3 text-sm leading-relaxed">
                      <PiCheck className="mt-0.5 shrink-0 text-success" /> {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm text-muted-foreground"><strong className="text-foreground">Use another form when:</strong> {selectedForm.notFor}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/eligibility">Check my form <PiArrowRight /></Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/forms">Compare all forms</Link>
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* How it works: horizontal flow strip */}
      <section className="py-16">
        <Reveal className="relative overflow-hidden rounded-3xl border border-border bg-card/95 p-7 shadow-[0_20px_60px_rgba(99,62,40,0.08)] backdrop-blur-sm sm:p-10">
          <div aria-hidden className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-secondary/70 blur-3xl" />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge variant="outline">How it works</Badge>
              <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">Three Steps, No Jargon</h2>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground"><PiClock /> Pick up where you left off</span>
          </div>
          <div className="relative mt-8 grid gap-4 sm:grid-cols-3 sm:gap-5">
            <div aria-hidden className="absolute left-[16%] right-[16%] top-7 hidden border-t border-dashed border-primary/25 sm:block" />
            {HOW.map((s, i) => (
              <motion.div
                key={s.title}
                whileHover={reduce ? undefined : { y: -5 }}
                className="relative rounded-2xl border border-border/80 bg-background/75 p-5 shadow-sm transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground shadow-md shadow-primary/20">
                    {i + 1}
                  </span>
                  <s.icon className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <Badge variant="primary">A useful finish line</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">From answers to a filing-ready map</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Export a clean PDF that names the portal field beside every figure. Your progress can
              also be downloaded as a private Filio file and imported later on any device.
            </p>
            <div className="mt-6 space-y-3 text-sm font-semibold">
              <p className="flex items-center gap-3"><PiCloudSlash className="h-5 w-5 text-primary" /> Generated locally—nothing is uploaded</p>
              <p className="flex items-center gap-3"><PiCursorClick className="h-5 w-5 text-primary" /> Clear download feedback, so you know it worked</p>
              <p className="flex items-center gap-3"><PiShieldCheck className="h-5 w-5 text-primary" /> Field-by-field handoff to the official portal</p>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="relative">
            <motion.div
              whileHover={{ rotate: 0, y: -5 }}
              initial={reduce ? false : { rotate: 1.5 }}
              animate={{ rotate: 1.5 }}
              className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/10"
            >
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">PDF summary</p>
                  <p className="mt-1 text-xl font-bold">ITR field-mapping sheet</p>
                </div>
                <PiFileArrowDown className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ["Gross salary / pension", "B1 (i)"],
                  ["Chapter VI-A deductions", "Part C"],
                  ["Total tax liability", "Part D"],
                ].map(([label, field], index) => (
                  <motion.div
                    key={label}
                    initial={reduce ? false : { opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between rounded-xl bg-muted/60 px-4 py-3"
                  >
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="rounded-md bg-card px-2 py-1 font-mono text-xs text-muted-foreground">{field}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm font-bold text-success">
                <PiCheck /> Ready to download
              </div>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* Trust: two-column band */}
      <section className="py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_1.2fr] lg:items-start">
          <Reveal>
              <Badge variant="outline">Privacy is the product</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Built to be trusted with your money
            </h2>
            <p className="mt-3 text-muted-foreground">
              Filing taxes is stressful enough. Filio keeps your data on your device and shows its
              working, so nothing feels like a black box.
            </p>
          </Reveal>
          <div className="space-y-4">
            {TRUST.map((t, i) => (
              <Reveal key={t.title} delay={i * 0.05}>
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                  <t.icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden />
                  <div>
                    <h3 className="font-bold">{t.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-24">
        <Reveal className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground">
          <motion.div
            aria-hidden
            className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[36px] border-white/10"
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Tax filing can feel this clear
          </h2>
          <p className="max-w-lg text-primary-foreground/90">
            Answer a few questions and see your tax in minutes. Free, no sign-up, nothing sent
            anywhere.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/eligibility">
              Find your form <PiArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <p className="text-xs font-semibold text-primary-foreground/75">No account · No card · No data upload</p>
        </Reveal>
      </section>
    </div>
  );
}
