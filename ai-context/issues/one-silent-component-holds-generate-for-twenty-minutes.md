# One silent component holds Generate for twenty minutes after the rest have finished

> **Package:** `@webiny/api-component-extraction` (`GenerateHandler`, `coordination.ts`)
> **Severity:** medium. On webiny.com (2026-10-09), 24 of 25 components settled within 16 minutes and
> the stage ran to 36, waiting on one component that never produced a result.
> **Status:** fixed 2026-10-09 (`0a11bf7854`). Cause established; verified deployed.

## What happens

Generate's coordinator waits for each component's result. A component whose task goes silent is
re-triggered after `CHILD_TIMEOUT_MS` (8 minutes), up to `CHILD_MAX_TRIGGERS`, and then marked
failed. On webiny.com one component went silent, so the stage spent about 20 minutes after the last
real result waiting out two timeouts, and finally recorded "no result recorded: the component task did
not finish".

## Cause (established 2026-10-09)

The component was not silent: it crashed. Both of its tasks failed about 2.5 minutes in with "Cannot
read properties of null (reading 'toLowerCase')". Its plan carried a `null` among a prop's observed
values (`routeAnnouncer`), and the invented-text check lowercased every value in its pool, so
validation crashed after every model call, before the attempt was logged. The coordinator watched only
for results, not its children's task status, so it waited out the 8-minute timeout after each crash.
Where the null entered the plan is not established; every writer found guards against it.

## Fix

- The text validators tolerate a non-string; Plan keeps only string observed values when it writes
  the artifact; Generate does the same on read, for plans already stored. Tested on the real stored
  component, and the test fails on the old validators.
- The coordinator records each child's task id and retries a child whose task failed or was aborted
  at once (or fails it when out of triggers), instead of waiting out the timeout.
- Verified deployed: the component regenerated, attempt 1 passed (287 s).

## Was: not established

Why that component's task went silent: a Lambda killed mid-call, a task that never started, or a
model call that ran past the invocation. The generation log and the task's own log for that component
are where to look. The waiting screen now names the component and shows it is being retried, so the
wait is visible; the cost of the wait is not addressed.
