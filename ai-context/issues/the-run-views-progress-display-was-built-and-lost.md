# The run view's progress display was built, then lost in a redesign three days later

> **Package:** `@webiny/app-component-extraction` (run view)
> **Severity:** low now (rebuilt 2026-10-09); recorded because a feature built, lost and rebuilt a
> release later tends to be lost again.
> **Status:** rebuilt as the waiting screens (`scripts/baseline/reports/2026-10-09/waiting-screens-plan.md`).

## History

- **Built 2026-08-12** (`1de65aca53`, "live progress + inline logs in the run view"): every stage's
  counted progress, pushed over the websocket, shown live as a bar and message per stage.
- **Lost 2026-08-15** (`f7558b14e8`, "W9.5 stage view frame + Assemble view"): the run view was
  reframed and the left column moved from `SteppedProgress` + `StageList` to `StageRail`. The progress
  rendering went with the old components. The presenter kept collecting progress (`progressByStage`,
  `applyProgress`), so nothing failed, no test went red, and the stages kept sending it. For eight
  weeks the only thing on screen while a stage ran was its raw log.
- **Rebuilt 2026-10-09** as the waiting screens: `StageWaiting` renders `progressByStage` for the
  running stage.

## Why it went unnoticed

The data path stayed whole (stages send, the websocket delivers, the presenter stores); only the last
step, rendering, was removed. A check that the progress reaches the presenter would still pass. What
would have caught it: a test that a running stage's panel shows its progress, or anyone watching a
long stage after the redesign.

## Guard

`StageWaiting` is the one consumer of `progressByStage`. A redesign of the run view's panel must keep
it, or move what it shows; grep for `progressByStage` consumers before deleting a component that
reads it.
