# Spend, all recorded extraction model calls

Every model call still recorded in this environment, priced with the project's table
(`src/domain/modelCost.ts`, taken 2026-10-06), which reproduces the 2026-10-06 baseline's $26.60 as
$26.59. Sources: each run's model-call log (Classify, Plan, and Generate until generation switched to
streaming at 14:50 UTC 2026-10-08) and the generation log for Generate after it (the model-call log
lost those calls until `2e10e4678f`; no call is counted from both).

## The sum

**$287.22 over 3,230 calls, 2026-09-21 to 2026-10-09.**

| Period                                                     | Spend      |
| ---------------------------------------------------------- | ---------- |
| Feature build, 2026-09-21 to 2026-10-05                    | $196.71    |
| This workstream: baseline to now, 2026-10-06 to 10-09      | **$90.50** |
| of which dry-run experiments (labelled, after 10-08 14:50) | $19.46     |

By stage: Generate $263.93 (91.9%), Plan $22.39, Classify $0.89. By model: Opus 5 $57.93 (472 calls,
the earliest runs), Sonnet 5 the rest. Largest day: 2026-10-02, $59.93.

## What it does not include

- **Calls cut off with no usage**: 27, up to about $7.34 at 98 tokens a second of output.
- **One run at the model-call log's 500-row cap** (2424 Tulane, `6ab5426e…#0001`): its figure is a floor.
- **Deleted runs**, and anything outside extraction (theme extraction, other features).

## Corrections to per-pass figures reported earlier

The effort, prohibitions and link passes, the timeout reproduction and the cost-share analysis were
priced with a formula written from memory ($3/$15 per million, cache read $0.30, write $0.75) instead
of this table ($2/$10, $0.20, $2.50 for Sonnet 5): about half again too high.

| Pass                 | Reported | Correct                                                                  |
| -------------------- | -------- | ------------------------------------------------------------------------ |
| Timeout reproduction | $1.40    | $0.61                                                                    |
| Effort               | $5.67    | $3.78                                                                    |
| Prohibitions         | $18.31   | $12.21                                                                   |
| Link wording         | $4.29    | $2.86                                                                    |
| Ablation             | $22.92   | about $15 (ran before experiments were labelled; scaled, not recomputed) |

The thinking-share figures (about three quarters of billed output, roughly two thirds of spend) are
ratios and do not move with the price.
