# Waiting screens and the activity log: plan

For the 2026-10-16 demo. No brief was found for this item; this is the reading, to confirm.

## What the user sees today while a stage runs

The stage panel shows the **raw activity log**: the background task's log lines, oldest first, and
nothing else, until the stage finishes and its view replaces it. Generate on webiny.com ran 36 minutes
like that.

The stages already **send counted progress** over the websocket: Capture "Captured <url>" with
pages done of total; Classify and Plan "n/total sections"; Generate "n done, n running, n pending, n
failed (of total)"; Promote per component. The run view collects it (`progressByStage`) and **renders
none of it**: the progress display was lost in an earlier redesign of the rail.

## Proposal

**1. A waiting screen per running stage,** in place of the log:

- **What it is doing**, in one plain sentence per stage ("Opening each page in a browser and recording
  its layout", "Writing a component for each cluster and checking it renders").
- **How far:** a bar from the stage's own count (pages, sections, components), the latest message
  under it, and the time elapsed.
- **How long, roughly:** once two items are done, a remaining-time estimate from the stage's own pace
  so far ("about 12 minutes left"), said as an estimate. No estimate for a stage with no count.
- **Generate** additionally shows its four counts (done, generating, waiting, failed), so a long
  generation reads as progress rather than as silence.
- **What comes next:** one line ("When this finishes, review the clusters before Classify").

**2. The activity log, hidden, not removed:** a "Show activity log" disclosure under the waiting
screen and under every finished stage's view, closed by default. Opened by default when a stage
**failed**, where the log is what the user needs.

**3. A stage that has not run** keeps today's sentence, with its Run button.

No backend change: the counts and messages already arrive. The Generate counts are parsed from its
progress message unless the four numbers are added to the progress payload (a one-line change, which
I would make so the screen does not depend on wording).

## Verification

The user verifies in the running admin (a real run on the check job, watching Capture, Plan and
Generate wait). Unit tests for the estimate (no estimate before two items; never below zero) and the Generate counts.

About a day.

## Settled before building (2026-10-09)

1. **The estimate: none; elapsed only, with the component still working named.** Replayed on the two
   Generate runs with per-component settle times: a throughput estimate (settled per minute so far)
   was within 2 minutes on the 2424 check run, and **20 to 33 minutes short at every point on
   webiny.com**, whatever the start rule (from 2 done, from a third, from 40%), and a +/-50% range held
   the true remaining time 0 times in 16. There, 23 of 25 components settled within 6.6 minutes, one
   at 15.7, and the stage ran to minute 36 waiting on one component whose task went silent (retried
   twice at an 8-minute timeout). No pace-based rule sees that tail coming. So Generate shows the
   counts and "1 component still working: <name>, 9 min 4 s (retrying: it stopped answering and was
   started again)", which is the truth the estimate would have hidden.
2. **"Did not pass" counts only components that ended without passing:** attempts used up with checks
   failing, no output, or a task that never answered. Recorded once per component, when its result
   appears. A failed attempt of a component still working is not counted.
3. **The step between stages:** a finished stage whose next stage has not run, with nothing running,
   shows what it produced ("5 pages captured.") and what the next stage will do, with its Run button.
4. **Degraded stages are treated like failed ones:** a finished Capture or Generate with per-item
   failures names them above its view ("2 pages could not be captured. The reasons are in the
   activity log below.") and opens the log by default.

Built: `59fea0b93a`. The progress display's history (built 2026-08-12, lost 2026-08-15) is in
`ai-context/issues/the-run-views-progress-display-was-built-and-lost.md`.
