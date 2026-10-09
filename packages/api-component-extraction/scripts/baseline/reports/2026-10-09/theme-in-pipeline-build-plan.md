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

So a bad theme is published, but not quietly: the card says what extraction was unsure of, and the run
says, after Plan, how well the theme fits what was measured. Re-extracting or switching themes is then
the user's call.

## Verification, before the demo

1. Unit: the job's theme step (publish and pin on success; failed state on error; no pin on failure);
   the gate's three messages (running, failed, pinned); create-job with and without a theme.
2. Deployed, end to end: a new job from a URL only (Park City Place, a demo site, as a new job; its
   demo job untouched): extraction runs alongside Capture, the theme is published and pinned, Cluster
   is refused until then, and the run goes through Generate binding against that theme.
3. Deployed, failure: a new job on an unreachable URL: the theme card shows the failure and both
   actions; "Use an existing theme" pins one and Cluster proceeds.
4. Existing jobs: the five demo jobs and the check job, unchanged: their runs read the same pinned
   theme as before.

About 2 days of work; the end-to-end run about $5.

## Not in this

Option B (the theme built from the pipeline's own measurements), removing the second crawl, and
per-run re-extraction. The theme-fit figure is the bridge: it measures, on every run, the gap B closes.
