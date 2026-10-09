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
