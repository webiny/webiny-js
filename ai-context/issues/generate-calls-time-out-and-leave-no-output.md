# Generate calls time out on some components and leave no output to diagnose

> **Package:** `@webiny/api-component-extraction` (`componentGeneration.ts`, `attemptBudget`), model
> calls through `@webiny/remote-components`
> **Severity:** high. On the check-run re-cluster (2026-10-08), 3 of 21 components produced nothing:
> the Site Header and the Footer, which are on every page, and Floor Plan Filter. A demo-site re-cluster
> after the demo would meet the same risk.
> **Status:** open. Diagnosed as far as the evidence allows; the cause is not established.

## What happens

Each model call may run 5 minutes (`PER_CALL_TIMEOUT_MS`). The three components failed all three
attempts with "The operation was aborted due to timeout" (300s, 300s, about 214s, the last cut by the
invocation's remaining time). An aborted call records no output, so what the model was doing for five
minutes is not visible.

## What it is not

Measured over all 29 attempts on the run:

- **Not member count.** Floor Plan Filter has 1 member and timed out; Intro/Description has 7 and
  finished in 15 seconds.
- **Not prompt length.** The failed prompts are 9.2K-13.6K characters of user text; the longest on the
  run (17.9K) passed in 146 seconds, and the Site Header's (9.2K) is shorter than most that passed.
- **Not the clustering change.** The Site Header and Footer clusters have the same 11 members and almost
  the same contracts before and after re-clustering (header 11 props before, 16 after; footer 24 and 24).

## What it tracks

Duration scales with output: about 95-103 tokens a second on this run (15K tokens in 146s, 25K in
265-278s). The 5-minute limit therefore caps a component at roughly 28-30K output tokens, and the
passes come close: Amenities & Neighborhood timed out on attempt 1 and passed on attempt 2 at 25.6K
tokens in 278 seconds.

The header and footer generated small outputs from the same contracts on 2026-10-06 (7,125 and 16,181
characters, about 2K and 4.5K tokens). Their prompts on this run are ordinary (the header's: five
defaults, three texts, a logo). For them to time out, the model either wrote more than six times as
much (a runaway answer) or the call stalled. The aborted call keeps nothing that tells these apart.
Floor Plan Filter is a known case: its long example defaults ran a call until the Lambda was killed
before the per-call limit existed.

## Whether it is new: the comparison is unavailable

The clustering change gave these components new signatures, so no earlier generation log exists for the
same component, and the 2026-10-06 generations predate the log. Whether the same contracts would time
out on the earlier prompt cannot be read from what is stored. That comparison is unavailable, not
pending. What is available: the same contracts produced 2K-4.5K tokens then, and across the dry-run
arms output size moved by at most 30% between prompt versions (Hero Intro 14K to 18-20K characters,
the others flat), nothing like the six-fold growth a runaway would need.

**The limit may be the defect.** At roughly 100 tokens a second against a 5-minute limit, a component
that legitimately needs 28-30K output tokens is at the ceiling by nature. If the header or footer turns
out to be writing that much legitimately, the per-call limit is what is wrong, not the component.

## Next

Record what an aborted call had produced (stream the call, keep the partial text and token count on
abort), then reproduce on the Site Header and Footer in dry-run mode. That tells a runaway from a stall,
and shows what a runaway is writing.
