# Theme extraction inside the pipeline: build plan (option A)

For the 2026-10-16 demo. Investigation and decisions: `theme-extraction-in-pipeline-investigation.md`.
A URL in, the pipeline does the rest; the extracted theme is published automatically; existing jobs
keep their pinned themes.

## Shape

The theme belongs to the **job**, as the pinned theme does today, not to each run: a job extracts its
theme once, on its first run, and every run pins that version. So this is not a tenth ledger stage
(which would mean a dependency graph: the theme must not block Capture, and re-running it must not
mark Capture stale). It is a job-level step with its own visible state, and one gate.

1. **Create job.** `themeEntryId` and `themeVersion` become optional. The create dialog's theme picker
   gets a first option, "Extract from this site" (the default for a new job); picking an existing
   theme keeps today's flow exactly.
2. **The job's theme step.** When a run starts for a job with no pinned theme, the job starts a new
   task, `componentExtractionJobTheme`, alongside Discover. It calls theme extraction's own use cases
   (crawl, analyse, under its `ExtractionLock`): extraction code is unchanged. Then it **publishes**
   the draft (`PublishThemeUseCase`) and **pins** the published version on the job.
3. **State on the job:** `themeExtraction = { status: running | done | failed, taskId, step,
themeId, version, confidence, uncertain[], pagesSampled, slotsApplied, error }`, written as it
   goes, read by the run view.
4. **The gate.** Cluster is the first stage that reads the theme. `componentExtractionRunStage` refuses
   Cluster while the job has no pinned theme, with a message that says why (below). Discover, Capture
   and Segment never wait for it: extraction runs alongside them (79-317s on the demo sites).
5. **Review, not a gate:** the run view shows a theme card: the theme (link to the Theme app),
   confidence, the uncertainties as extraction wrote them, pages sampled, slots applied.

## The two cases, chosen

**Extraction fails.** The job's theme step is `failed`, with extraction's own error, shown on the
theme card the moment it fails, not first at Cluster. Nothing retries silently. The card offers two
actions: **Retry extraction**, and **Use an existing theme** (the old picker), which pins that theme
and the run carries on. If Cluster is pressed first, the gate says the same thing: "This job's theme
could not be extracted (<reason>). Retry it, or pick an existing theme." The run is never left
waiting on something the user cannot see or act on. While extraction is still running, the gate says
so and names its step ("crawling 3 of 5 pages").

**Low confidence.** Measured first: extraction's `confidence` is the model's self-report on a
three-step scale, and **all six themes extracted so far say "medium"**, with 9-10 uncertainties each.
It does not discriminate, so a threshold on it would either never fire or always fire. Chosen
behaviour: **publish regardless**, and make the risk visible where the user is already looking:

- the theme card shows the confidence and every uncertainty, and flags **thin evidence** the data can
  support: fewer than 3 pages sampled (thevibe's theme came from 1 page) or `"low"` confidence;
- after Plan, the run shows a **theme fit** figure the pipeline measures itself: of the colours,
  type sizes and spacing Plan measured on the sections, how many the theme has a token for. That is
  the signal confidence is not: the issues behind option B come from exactly that mismatch (26 of 206
  colours with no token near them).

**Re-extraction on a successful theme.** Pinning once would fix a theme from a bad crawl, or from a
site that has since changed, for the life of the job. So the theme card offers **Retry extraction** on
a successful theme too (the same action as after a failure), behind a confirmation: it extracts again,
publishes, re-pins, and marks every stage from Cluster on stale for the job's current run. The
previous theme stays in the Theme app; nothing is deleted.

So a bad theme is published, but not quietly: the card says what extraction was unsure of, and the run
says, after Plan, how well the theme fits what was measured. Re-extracting or switching themes is then
the user's call.

## What the gate message can say (checked against the crawl)

The crawl reports per page: after the entry page, then before each page it reads, with the pages done,
the total and the URL. So, while crawling, the message reads **"read 2 of 5 pages, now reading
/floor-plans"**: the count is pages finished, not the page in hand. The total starts at the crawl
limit (5) and is revised to the pages actually chosen (2 on Freehill), so it can drop; the message
shows the latest. Analysis is one model call with no progress inside it, and is the longer phase, so
it reads **"analysing the crawled pages"** with no count. A cached crawl (a site extracted before)
skips straight to analysis.

## Known limit: one extraction per tenant

`ExtractionLock` lets one theme extraction run at a time per tenant. Two jobs created together
serialise: tolerable for two at 79-317 seconds each, not for twenty. A second job's theme step waits
for the lock and says so ("waiting for another theme extraction to finish") rather than failing. Not a
demo problem; written here so a batch of jobs does not discover it.

## Verification, before the demo

1. Unit: the job's theme step (publish and pin on success; failed state on error; no pin on failure);
   the gate's three messages (running, failed, pinned); create-job with and without a theme.
2. Deployed, end to end, on **a site never extracted before**: first-time extraction on an unknown
   site is what this changes. (A demo site would reuse its cached crawl and an existing theme's
   lineage, and pass without exercising the new path.) Extraction runs alongside Capture, the theme is
   published and pinned, Cluster is refused until then with the running message, and the run goes
   through Generate binding against that theme. Then Retry extraction on the successful theme: the
   confirmation, a new published version pinned, Cluster onward stale.
3. Deployed, failure: a new job on an unreachable URL: the theme card shows the failure and both
   actions; "Use an existing theme" pins one and Cluster proceeds.
4. Existing jobs: the five demo jobs and the check job, unchanged: their runs read the same pinned
   theme as before.

About 2 days of work; the end-to-end run about $5.

## Not in this

Option B (the theme built from the pipeline's own measurements), removing the second crawl, and
per-run re-extraction. The theme-fit figure is the bridge: it measures, on every run, the gap B closes.

## Built (2026-10-09) and verified so far

Backend `12484ed2e0` (and `3cb442f508`, below); admin `b197c9b04b`. Unit tests: the theme step
(publish and pin on success; extraction's reason and no pin on a crawl or publish failure; the lock
wait; a retry re-pins and marks Cluster onward stale), the gate's messages, the crawl wording, the
theme fit.

**Verification 3, the failure path, deployed.** A job on an unreachable URL
(`unreachable-theme-check.invalid`, job `6ac8ab10…#0001`, safe to delete): created with no theme;
starting its run started the theme task; the task recorded extraction's own reason ("could not read
… net::ERR_NAME_NOT_RESOLVED"); Cluster refused with "This job's theme could not be extracted (…).
Retry it, or pick an existing theme."; Use an existing theme pinned one, and the gate then let Cluster
through to its ordinary predecessor check. This also verified the new dependency deployed: the
background function loaded the task and ran extraction's crawl.

**Verification 4.** The 22 existing jobs read with their pinned themes and no theme extraction.

**Theme fit on stored runs:** colours 69-93%, type 91-100%, spacing 8-21% (2424 check run, Freehill,
Westland). Spacing has five semantic slots and counts a value fitted within 15% of its slot: the
filed spacing gap, now a number on every run.

**One incident on the way.** The first backend deploy took the whole GraphQL API down: the theme-fit
query's description sat between another field's description and its field. Invalid SDL builds,
type-checks and passes every test; nothing parsed the schema before the deployed API did. Fixed in
`3cb442f508`, with a test that parses the schema and fails on that exact mistake.

**Verification 2, first-time extraction on webiny.com, deployed** (job `6ac8ac6d…#0001`, run
`6ac8ac6e…#0001`). Never a job's theme; its Theme-app crawl from 2026-09-21 was past the 7-day cache,
so the crawl ran fresh: the real first-time path.

- **Alongside the pipeline.** Created from the URL alone; the run started the theme step at once. It
  reported per page as checked ("read 0 of 5 pages, now reading /", then /features, /pricing, /blog,
  /docs; then "analysing the crawled pages"), and was published and pinned 2m33s in, while Capture
  was still running (Capture finished 25s later).
- **The extracted theme:** confidence "medium", 13 uncertainties, 5 pages, 49 tokens.
- **The gate:** Cluster was accepted the moment Segment finished, because the theme was already
  pinned. So the "still being extracted" refusal was not exercised live on this run; it is covered by
  the unit tests, and the failure-path refusal was exercised deployed (verification 3).
- **Downstream:** Cluster through Generate ran against the new theme. 24 of 25 components generated,
  **0 token-binding failures**: the auto-published theme resolves and binds. 6 failed checks, none
  about the theme: 5 text preservation (3 missing source text, 2 invented filler such as "Amazing
  product"), 1 with no output ("the component task did not finish").
- **Theme fit:** colours 88/113 (78%), type 71/88 (81%), **spacing 5/52 (10%)**: the same spacing gap
  on a different CMS from the five customer sites.
- **Retry on the successful theme:** the site was crawled again from page 1 (not the cached crawl), a
  theme published and pinned, and Cluster through Generate marked stale; Assemble and Promote, never
  run, left pending. **One difference from the plan's wording:** a retry pins a **new theme**
  (`6ac8b7c9…` v1), not a new version of the first (`6ac8ad0a…`): extraction always creates a theme.
  Both stay in the Theme app.
- **Cost:** $3.18 of recorded model calls (Classify, Plan, Generate; 34 Generate calls recorded, so
  the stream-recording fix holds on a full run). Extraction's own vision calls are not in the run's
  record: they run outside its model-call scope.
