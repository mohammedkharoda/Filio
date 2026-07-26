# Prepare an Indian income tax return with Filio

Filio is a private, browser-based income tax return preparation tool for Indian taxpayers. It recommends an Income Tax Return (ITR) form, collects the relevant information, compares the old and new tax regimes, and generates a field-mapping PDF for the official filing portal.

Filio prepares information but does not submit a return. It is not a tax advisor or an authorised e-filing intermediary.

<p align="center">
  <img src="public/filio-logo.png" alt="Filio" width="220" height="139" />
</p>

## Project status

Filio currently targets Assessment Year (AY) 2026-27 and Financial Year (FY) 2025-26.

| Form | Status | Current coverage |
| --- | --- | --- |
| ITR-1 (Sahaj) | Ready | Computes supported salary, pension, house property, interest, deductions, tax regimes, Tax Deducted at Source (TDS), refund, and balance payable |
| ITR-2 | Guided preparation | Captures salary, detailed house properties, capital gains, other income, and deductions. Complex gains and portal schedules remain staged |
| ITR-3 | Guided preparation | Adds regular-books business or profession summaries and capital gains. The official portal completes business schedules, set-offs, and final tax |
| ITR-4 (Sugam) | Guided preparation | Captures presumptive income under sections 44AD, 44ADA, and 44AE. The official portal completes final presumptive tax |

The application labels staged calculations in the interface and generated PDF. It does not include staged amounts in a final tax claim.

## What Filio does

Filio supports the preparation workflow from form selection to export:

1. Recommends ITR-1, ITR-2, or ITR-3 from 12 eligibility questions
2. Offers ITR-4 when presumptive taxation may apply
3. Adapts the wizard steps to the selected form
4. Parses supported Form 16 fields inside the browser
5. Computes supported income heads under both tax regimes
6. Shows a live tax, refund, or balance estimate
7. Saves progress in the browser
8. Exports and imports a portable `.filio.json` progress file
9. Generates a client-side PDF with portal field mappings
10. Explains tax terms through a searchable glossary

## Privacy model

Filio runs as a static client-side application. Taxpayer data does not require a Filio server.

- No account, authentication system, or user database
- No API routes or server actions
- No analytics, advertising, or tracking code
- No financial-product recommendations
- No uploaded Form 16 documents
- No server-side PDF generation
- No automatic submission to the Income Tax Department

The browser stores the current session in IndexedDB. Import, export, PDF generation, tax computation, and Form 16 parsing run on the device.

The original Form 16 PDF is read into memory for extraction. Filio stores the extracted fields, not the source PDF.

## Application flow

```text
Landing page
    |
    +-- Form recommender --> Selected ITR form
    |                           |
    +-- Forms catalog ----------+
                                |
                                v
                         Form-aware wizard
                                |
                   +------------+------------+
                   |                         |
             Live tax panel          IndexedDB autosave
                   |                         |
                   +------------+------------+
                                |
                                v
                         Review answers
                                |
                                v
                  PDF and progress-file export
                                |
                                v
                    Official income tax portal
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing page and product overview |
| `/forms/` | ITR-1 through ITR-4 comparison and manual selection |
| `/eligibility/` | Form recommendation questionnaire |
| `/wizard/` | Form-aware preparation workflow |
| `/review/` | Collected answers and tax review |
| `/download/` | PDF export, printing, and portal field mapping |
| `/glossary/` | Searchable tax glossary with category filters |

The project uses trailing-slash routes so static hosts resolve each exported directory consistently.

## Technology

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 App Router and React 19 |
| Language | TypeScript with strict checks |
| Styling | Tailwind CSS v4 |
| Components | Radix UI primitives and local component variants |
| Animation | Motion with reduced-motion support |
| State | Zustand |
| Local persistence | IndexedDB through `idb` |
| Validation | Zod and local validation helpers |
| PDF parsing | `pdfjs-dist` |
| PDF generation | `pdf-lib` |
| Unit testing | Vitest and Testing Library |
| End-to-end testing | Playwright |
| Deployment output | Next.js static export |

## Requirements

Install these tools before running the project:

- Node.js 20 or later
- npm
- A current Chromium, Firefox, or Safari browser with IndexedDB enabled

No environment variables, external services, or database are required.

The production build downloads Plus Jakarta Sans and Space Grotesk through `next/font`. The build environment must allow access to Google Fonts.

## Run the project locally

Install the locked dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

Open [the local Filio application](http://localhost:3000).

If port `3000` is occupied, Next.js selects another port and prints it in the terminal.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run start` | Call `next start`; this command is not compatible with the current static-export configuration |
| `npm run lint` | Run ESLint across the project |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Run the unit suite once |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run build` | Build and export the static application to `out/` |

Run the standard validation sequence before submitting a change:

```bash
npm run lint
npm run typecheck
npm run test:run
npm run build
```

## Project structure

```text
app/
  (marketing)/       Landing, forms, eligibility, and glossary routes
  wizard/            Form-aware wizard route
  review/            Review route
  download/          Export and field-mapping route
  globals.css        Design tokens, accessibility, and ambient background
components/
  ui/                Shared interface primitives
  wizard/            Form steps, registry, navigation, and shell
  glossary-browser   Search and category interface
  tax-panel          Live regime and tax comparison
content/
  glossary.ts        Tax terms and category metadata
lib/
  form16/            Client-side Form 16 PDF extraction
  output/            Field mapping and PDF generation
  storage/           IndexedDB and progress-file import/export
  tax-engine/        Tax calculation, form registry, and eligibility rules
store/
  index.ts           Zustand store, selectors, and autosave
  types.ts           Versioned session types
tests/e2e/            Playwright flows
public/               Logos, PDF worker, and static-host headers
```

## Tax engine

The tax engine lives in [`lib/tax-engine`](lib/tax-engine). It uses pure functions so calculations can run without browser or network access.

### Assessment-year configuration

Rates and limits for AY 2026-27 live in [`lib/tax-engine/config/ay-2026-27.ts`](lib/tax-engine/config/ay-2026-27.ts). The configuration includes:

- Old and new regime slabs
- Standard deductions
- Section 87A rebates
- Marginal relief
- Chapter VI-A deduction limits
- Health and education cess
- Section 112A exemption and rate

Re-verify every assessment-year figure against the [official Income Tax Department portal](https://www.incometax.gov.in/) before a public release.

### Core calculation

[`lib/tax-engine/engine.ts`](lib/tax-engine/engine.ts) computes both regimes for supported income heads. It returns tax details, rebate, cess, total liability, the cheaper regime, and the difference between regimes.

### Multi-form calculation

[`lib/tax-engine/multi-form.ts`](lib/tax-engine/multi-form.ts) separates computed income from staged income:

- ITR-1 returns a complete result for the implemented scope
- ITR-2 stages complex capital gains and related schedules
- ITR-3 stages business, profession, and complex capital-gains schedules
- ITR-4 stages presumptive income for final portal computation

Flat-rate heads may show an indicative amount when the rate is deterministic. Set-off, indexation, grandfathering, books adjustments, and portal-only schedules remain outside the final Filio total.

### Eligibility and form selection

[`lib/tax-engine/eligibility.ts`](lib/tax-engine/eligibility.ts) contains the ITR-1 eligibility gate and form recommendation logic.

The recommender chooses:

- ITR-1 for supported resident individual returns
- ITR-2 when the answers exceed ITR-1 scope without business income
- ITR-3 for business or profession income
- ITR-4 as an offered alternative when presumptive conditions appear to fit

The recommendation is educational guidance. Taxpayers must confirm their form on the official portal or with a qualified professional.

## Form-specific wizard

[`lib/tax-engine/forms.ts`](lib/tax-engine/forms.ts) defines the form registry. Each form lists its label, audience, exclusions, readiness status, and ordered wizard steps.

[`components/wizard/step-registry.tsx`](components/wizard/step-registry.tsx) maps each step key to its component. The current steps cover:

- Personal and residency information
- Salary, pension, and TDS
- House properties
- Capital gains and virtual digital assets
- Business or profession summaries
- Presumptive income
- Interest and other income
- Chapter VI-A deductions
- Old and new regime selection

## Data storage and portability

[`lib/storage/index.ts`](lib/storage/index.ts) manages browser persistence.

### IndexedDB session

The Zustand store schedules an IndexedDB save 600 ms after a change. Reloading the application restores the last session from the `filio` database.

### Progress export

**Export progress** downloads a `.filio.json` file with:

- Application identifier
- Export schema version
- Export timestamp
- Versioned Filio session data

The import flow validates the wrapper and session version before updating the store. Version 1 exports remain compatible with the version 2 multi-form data model.

### Data deletion

**Delete all my data** opens a confirmation dialog. Confirming clears the IndexedDB store, deletes the local database, resets the Zustand state, and returns to the landing page.

## PDF and field mapping

[`lib/output/mapping.ts`](lib/output/mapping.ts) converts the selected regime and collected answers into portal-oriented sections.

[`lib/output/pdf.ts`](lib/output/pdf.ts) creates the downloadable PDF in the browser. The document includes:

- Taxpayer and assessment-year details
- Selected form and regime
- Income and deduction field mappings
- Tax, TDS, refund, or payable figures
- Staged schedule notices
- Portal filing steps
- Legal disclaimer

The download helper delays object-URL cleanup to prevent cancellation in Safari and embedded browsers.

## Form 16 parsing

[`lib/form16/index.ts`](lib/form16/index.ts) uses `pdfjs-dist` to extract supported fields from a Form 16 PDF:

- Permanent Account Number (PAN)
- Employer Tax Deduction Account Number (TAN)
- Employee name
- Employer name
- Gross salary
- Tax deducted

PDF layouts differ between employers. Taxpayers must compare extracted values with the source document before continuing.

## Glossary

[`content/glossary.ts`](content/glossary.ts) is the shared source for the glossary page, inline tooltips, and help panel.

Each term includes:

- A display term
- A one-sentence explanation
- An optional detailed explanation
- A browsing category

The `/glossary/` route supports URL-based search and category filters, so filtered views can be bookmarked.

## Accessibility and interface behavior

The interface includes:

- Semantic buttons, links, form labels, tables, and headings
- Keyboard-visible focus states
- Reduced-motion handling
- Screen-reader live regions for saves, exports, validation, and tax updates
- Mobile safe-area spacing
- Touch-sized controls
- Responsive wizard navigation and tax summary
- Color tokens with semantic success, warning, and destructive states

## Testing

The unit suite covers:

- AY 2026-27 tax scenarios
- Eligibility rules
- Multi-form staging
- Field mappings
- Storage export and import
- Browser download cleanup
- Input validation

Test files live beside their modules. Playwright flows live in [`tests/e2e`](tests/e2e).

When tax rules change, add tests before updating the assessment-year configuration. Tests should cover slab boundaries, rebate boundaries, deduction caps, regime ties, TDS differences, and staged income.

## Static build and deployment

[`next.config.ts`](next.config.ts) sets `output: "export"`. Running `npm run build` writes the deployable application to `out/`.

The exported application has no runtime Node.js server. Serve `out/` from a static host.

### Netlify

[`netlify.toml`](netlify.toml) configures:

```toml
[build]
  command = "npm run build"
  publish = "out"
```

Netlify uses Node.js 20 for the build.

### Vercel

Import the repository as a Next.js project. Vercel runs the static export and serves the generated files.

### Other static hosts

Configure another host to:

1. Run `npm ci`
2. Run `npm run build`
3. Publish `out/`
4. Preserve trailing-slash route handling
5. Apply the headers from [`public/_headers`](public/_headers) when the host supports that format

## Security headers

[`public/_headers`](public/_headers) defines baseline static-host protections:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `X-Frame-Options: DENY`
- A restricted `Permissions-Policy`

Review host-specific header support during deployment.

## Known limitations

The current release does not:

- File or e-verify a return
- Connect to the Income Tax Department
- Import Annual Information Statement (AIS), Taxpayer Information Summary (TIS), or Form 26AS data
- Compute every ITR-2 capital-gains scenario
- Compute final ITR-3 business or profession tax
- Compute final ITR-4 presumptive tax
- Model every set-off, carry-forward, surcharge, indexation, or grandfathering rule
- Capture every foreign-asset or foreign-income schedule
- Replace professional tax advice

## Making ITR-2, ITR-3, and ITR-4 ready

Before changing these forms from **Guided preparation** to **Ready**, complete and verify:

1. All mandatory schedules and validation rules
2. Loss set-off and carry-forward logic
3. Capital-gains classification, indexation, and grandfathering
4. Foreign asset and foreign income schedules where applicable
5. Business books, depreciation, disallowances, and audit-related fields
6. Presumptive scheme limits and vehicle calculations
7. Final tax integration for every captured income head
8. Portal field mappings for every supported schedule
9. Assessment-year fixtures and boundary tests
10. Review by a qualified Indian tax professional

## Adding an assessment year

Add a new year without editing historical rules:

1. Create a configuration file under `lib/tax-engine/config/`
2. Add its assessment-year type and default selection
3. Update the store migration when the data shape changes
4. Add verified tax-engine fixtures
5. Update form eligibility rules
6. Update glossary figures and public copy
7. Run the full validation sequence

## Contributing

Keep changes within Filio’s privacy and accuracy boundaries:

1. Create a focused branch
2. Add or update tests with the implementation
3. Run lint, type checks, unit tests, and the static build
4. Confirm that no taxpayer data leaves the browser
5. Document new fields, routes, formats, and limits
6. Request tax-rule review for calculation changes

Avoid claims such as guaranteed refund, guaranteed accuracy, or automatic filing.

## Legal notice

Filio is an educational preparation tool. Taxpayers remain responsible for checking their information, confirming their form, reviewing calculations, filing on the official portal, and completing e-verification.

This repository does not currently include a software licence file. Do not assume redistribution or modification rights until the project owner adds one.
