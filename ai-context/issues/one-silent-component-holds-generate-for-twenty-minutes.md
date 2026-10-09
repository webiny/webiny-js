# One silent component holds Generate for twenty minutes after the rest have finished

> **Package:** `@webiny/api-component-extraction` (`GenerateHandler`, `coordination.ts`)
> **Severity:** medium. On webiny.com (2026-10-09), 24 of 25 components settled within 16 minutes and
> the stage ran to 36, waiting on one component that never produced a result.
> **Status:** open. Found while measuring the waiting-screen estimate.

## What happens

Generate's coordinator waits for each component's result. A component whose task goes silent is
re-triggered after `CHILD_TIMEOUT_MS` (8 minutes), up to `CHILD_MAX_TRIGGERS`, and then marked
failed. On webiny.com one component went silent, so the stage spent about 20 minutes after the last
real result waiting out two timeouts, and finally recorded "no result recorded: the component task did
not finish".

## Not established

Why that component's task went silent: a Lambda killed mid-call, a task that never started, or a
model call that ran past the invocation. The generation log and the task's own log for that component
are where to look. The waiting screen now names the component and shows it is being retried, so the
wait is visible; the cost of the wait is not addressed.
