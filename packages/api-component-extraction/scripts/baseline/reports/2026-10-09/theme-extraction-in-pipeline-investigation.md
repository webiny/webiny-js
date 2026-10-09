# Theme extraction inside the pipeline: investigation

Read-only; no code changed. Demo on 2026-10-16.

**Reading of the item (to confirm).** The brief for the experience work was not found in the repo,
the briefs folder or the session notes, so this is the reading the report is written against: today a
job cannot start from a URL alone. It needs a theme extracted beforehand in the Theme app, published,
and picked at job creation. "Theme extraction inside the pipeline" makes extracting the site's theme
part of the job, so a job starts from a URL.

## How it works today

- **A job pins a theme at creation.** `componentExtractionCreateJob` requires `themeEntryId` and
  `themeVersion`; the create dialog lists themes. Every run of the job uses that pinned version.
- **The theme must be published.** `ThemeManifestResolver` refuses a draft: "publish it before
  extracting against it". The manifest (bindable slots and CSS variables) is a projection of the
  published snapshot.
- **Which stages read it:** Cluster (the token term of section similarity), Plan (token bindings,
  type scale, spacing, colours), Generate (vocabulary, validator), Assemble, and the render tasks.
  Discover, Capture, Segment and Classify never touch it.
- **Theme extraction** (`@webiny/api-theme-extraction`, task `themeExtraction`): one mutation
  (`extractTheme`) starts it; progress over websockets. It crawls its own pages (default 5, its own URL
  scoring), analyses them with the vision model, and saves a **draft** theme. `maxIterations = 1`, and
  an `ExtractionLock` lets only one extraction run per tenant at a time.
- **How long:** on the five demo sites, 79-317 seconds (2026-09-21/22, `backgroundTasks`), the same
  order as Capture.

## What has to be decided

1. **Where it runs.** The theme is first needed at Cluster, so extraction can run alongside Discover,
   Capture and Segment and must finish before Cluster. Run as a stage before Discover, it adds its
   full duration to every first run; alongside Capture, it adds nothing when Capture is longer.
2. **Draft to published.** Extraction saves a draft; the pipeline needs a published version. Either
   the job publishes it automatically, or it stops for the operator to look at the theme and publish
   it, as every other stage is an inspect/re-run gate. A theme is upstream of everything the job
   generates, so a wrong colour or type scale reaches every component.
3. **Two crawls or one.** Extraction crawls its own pages; Capture crawls the job's. Two crawls of the
   same site, each with its own page choice. Reusing Capture's output would remove one, but extraction
   reads its own crawl format: a larger change.
4. **Re-runs.** A job pins one theme; whether a new run re-extracts (a new theme, or a new version of
   the same one) or reuses the pinned version.
5. **The lock.** One extraction per tenant: two jobs created together would queue or fail.
6. **The known gap.** Theme extraction captures less than the sites use (spacing, type, colour;
   `ai-context/issues/theme-extraction-captures-less-than-the-site-uses.md`). The pipeline already
   measures each section's spacing, type and colours in Plan, on more pages than extraction reads.

## Options

- **A. Wrap extraction as the job's first step (recommended for the 16th).** Create-job takes a URL
  and "extract a theme from this site" in place of a theme picker. The job starts extraction as it
  starts Discover, waits for it before Cluster, publishes the draft (automatically, or at a gate),
  and pins it. Extraction code unchanged; new work is in the job, the ledger and the create dialog.
  Two crawls remain.
- **B. Build the theme from the pipeline's own capture.** No second crawl; built from the measurements
  Plan already makes across every captured page, which is where extraction's gap lies. A new theme
  derivation, larger than a week, and it changes what the demo themes would be.
- **C. A now, B later.** A gives the demo a URL-only start; B is the follow-on that removes the
  second crawl and addresses the gap with data the pipeline already has.

## Decided (2026-10-09)

1. **The item:** a URL in, the pipeline does the rest.
2. **Publish automatically.** Stopping for review would replace the step being removed. Extraction
   already reports its confidence and uncertainties: those are surfaced in the pipeline's own review,
   not as a gate.
3. **Existing jobs keep their pinned themes;** the new flow is for new jobs only.
4. **A for the 2026-10-16 demo, B after.**

**B is where the three filed theme-extraction issues get closed rather than patched:**
`theme-extraction-captures-less-than-the-site-uses.md` (colour, type and spacing, as one finding),
`an-extracted-theme-cannot-express-its-own-sites-colours.md` and
`theme-extraction-stops-short-of-the-sites-own-headings.md`. Each describes extraction reading less of
the site than the site uses. The pipeline already measures type, colour and spacing in Plan, across
more pages than extraction reads; a theme built from those measurements removes the cause the issues
describe, where patching extraction would chase each instance.

## Questions that were open

1. Is the reading above the item you meant?
2. Publish automatically, or stop for the operator to review and publish?
3. Should the demo's existing jobs keep their pinned themes (no change to them), with the new flow for
   new jobs only?
