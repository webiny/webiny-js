# Verifying a pipeline change: choose the instrument first

Read this before choosing how to verify a change to the extraction pipeline.

## A stage re-run is not a before-and-after measurement for a model-backed stage

Classify, Plan and Generate call the model on every run, and nothing is cached. Re-running Plan on Park
City (2026-10-07) renamed or reshaped the props of all 8 components: `paragraphs[]` became
`description` + `secondaryText`, and a Link's `href` became `url`. A plan diff across a re-run measures
that churn mixed with the code change, and you cannot separate the two. The one prop that could be read
(an image list) was readable only because its shape happened to stay the same.

A re-run also marks the run's downstream stages stale and can rename components, which breaks
regeneration by name.

## Instruments, cheapest first

1. **Offline replay.** Run the old code (`git show HEAD:<file>`) and the new code on the same saved
   inputs: a stage artifact's props, plus the real captured trees. Replay every planned component, not
   only the ones the change targets. Name a should-change set and a should-not-change set before the
   run, and report against them. This is the only instrument that isolates a deterministic change
   (binder, harvesting, prompt assembly) from model variance.
   - It costs nothing, so replay all of them. On 2026-10-07 the full replay caught a regression on a
     site nobody was looking at: requiring an image on list items emptied thevibe's photo gallery and
     slideshow, whose photos are links.
2. **Per-component Generate** (`componentExtractionGenerateComponents`). Use this for what the model
   does with corrected data. A close result is regenerated twice on the same code before attributing
   it.
3. **Site-wide runs** are for acceptance only.

A stage re-run can be read only on output whose shape survived the re-run, and that has to be checked
first, not assumed.

## Replay what is deployed, not only what the new code produces

A replay covers the artifacts it is fed. #2 (tagging each bound value with the copy it came from) was
verified by replaying old against new binder on fresh binds, and was correct there. But the tags
exist only on plans made after it shipped, and the stored plans of 7 of 8 runs predate it, so in
production it covered 1 run of 8. It was correct where it was built and inert everywhere else, and
nothing failed to say so.

The replay would have caught it had it included the plans as stored. So a replay of a change that
reads a field another change writes includes artifacts made before that field existed, and reports
how many of them the change actually reaches.

## Re-measure what looked load-bearing after fixing anything upstream of it

A measurement can be right and its conclusion wrong for a reason outside what it measured. Removing
"Use ONLY these theme variables" first raised hex literals, failed runs and cost, and the line was kept.
After the prompt's vocabulary was made to match the validator's, the same ablation changed nothing: the
line had been absorbing the mismatched lists' consequences (`reports/2026-10-08/line5-result.md`).
Record what a "load-bearing" result was measured against, and re-measure it when that changes.

## Do not read a mechanism into a handful of runs

Twice now a small count was read as a cause. Line 5's first ablation was one measurement on one prompt,
read as a permanent property of the line. In the prohibitions pass, invented social links appeared in
2 of 4 runs with "Do NOT invent image URLs" and 0 of 2 without it, read as "the line invites URLs by
discussing them". Measured on purpose, 8 runs per arm, no line was the worst arm (2 invented, against 1
and 0): the 2-of-4 was noise (`reports/2026-10-08/link-wording-result.md`). Before a count of a few
becomes an explanation, run the arms that would show it wrong, and say how many runs a claim rests on.

## Look at what a fix changes, not only the totals

A deeper cluster fingerprint separated mixed clusters and kept every genuine copy together, which the
totals showed as an unqualified improvement. The crops of its splits showed it also split one template
by content length (a deeper tree counts paragraphs). Contact sheets of every split and merge are part of
any clustering change (`reports/2026-10-08/clustering-depth-cap-proposal.md`).
