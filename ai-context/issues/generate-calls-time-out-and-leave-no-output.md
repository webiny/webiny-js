# Generate calls time out on some components and leave no output to diagnose

> **Package:** `@webiny/api-component-extraction` (`componentGeneration.ts`, `attemptBudget`), model
> calls through `@webiny/remote-components`
> **Severity:** high. On the check-run re-cluster (2026-10-08), 3 of 21 components produced nothing:
> the Site Header and the Footer, which are on every page, and Floor Plan Filter. A demo-site re-cluster
> after the demo would meet the same risk.
> **Status:** open. Cause established 2026-10-08: unstreamed model thinking, not the answer and not a
> stall (see "Reproduction").

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

## Reproduction (2026-10-08, dry-run, streamed call)

The call now streams, so an aborted call keeps what it wrote and when its chunks arrived. Site Header
and Footer were run in dry-run mode, with Social Media Links at the same moment as a control
(`anthropic/claude-sonnet-5`, no thinking setting, so the model's default thinking applies):

| Component          | Attempt | Outcome   | Duration | First text chunk | Answer       | Output tokens billed |
| ------------------ | ------- | --------- | -------- | ---------------- | ------------ | -------------------- |
| Site Header        | 1       | timed out | 300s     | none             | 0 characters | not reported         |
| Site Header        | 2       | passed    | 268s     | 244.6s           | 9,413 chars  | 26,318               |
| Footer             | 1       | passed    | 259s     | 214.8s           | 17,254 chars | 25,687               |
| Social Media Links | 1       | passed    | 54s      | 34.3s            | 6,772 chars  | 5,497                |

- **Not a runaway answer.** The answers are the size they were on 2026-10-06 (header 9.4K against
  7.1K characters, footer 17.3K against 16.2K). The six-fold growth is not in the answer.
- **The time is thinking.** Each call is silent until shortly before it ends, then writes its answer in
  20-45 seconds. The billed output is 26K tokens for a 9.4K-character header; roughly nine tenths of
  it is thinking the stream does not carry as text (no reasoning text arrives either).
- **Not a stall, provider or call path.** Billed output over duration is 98-99 tokens a second on both
  long calls, the rate of every completed call on the check run: the model was generating throughout.
  The control streamed normally through the same path at the same moment. The timed-out header attempt
  is the same call thinking past 300 seconds (about 30K tokens at that rate).
- **So the limit is not the defect in itself.** The header does not legitimately need 28-30K tokens to
  write a 9K-character component; it needs them only because thinking is unbounded. What bounds the
  call is the model's default thinking, which the call does not set. Thinking also counts against
  `MAX_OUTPUT_TOKENS` (32K), so a call that is not cut off by time is cut off at the token cap.

**The streaming fix paid for itself on its first use.** Three to four minutes of silence followed by a
complete answer was indistinguishable from a stall until chunk timing was recorded. Every conclusion in
this section rests on it.

## Every cost figure in this project is mostly thinking

Measured over all 213 logged attempts with usage (2026-10-07 and 08, every run that has a generation
log): **about three quarters of billed output tokens is thinking** (0.72-0.76; the per-attempt median is
0.73, the lowest tenth under 0.31). Output is 87% of Generate's spend, so thinking is roughly two thirds
of the money. The answer's share is estimated from its length at 3.4-4.0 characters a token, calibrated
on the three streamed calls (text-phase duration times their measured token rate).

So the ablation's $22.92, and every pass priced since the log existed, mostly paid for tokens that
produced no text. The $26.60 baseline predates the log and cannot be split, but ran on the same model
with the same unset thinking. Two further corrections to those figures:

- Not "nine tenths". That held on the two long calls of the reproduction (0.90-0.91), not across runs.
- They undercount. The 12 attempts cut off at the time limit report no usage, so no figure includes
  them, though a cut-off call has generated up to about 30K tokens before it stops.

Not decided here: bounding thinking (effort or a thinking setting on the generation call), raising the
per-call limit, or both. Either changes cost and possibly quality, so it is measured before it ships.
Also open: whether thinking was this long on 2026-10-06 cannot be read from what is stored.

## Next

Done: the call streams and the log keeps partial output and chunk timing (the provider reports no
token count for a cut-off call). Next: measure a bounded-thinking setting on these three components
against the current default, for duration, answer quality and cost, before choosing.
