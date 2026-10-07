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
