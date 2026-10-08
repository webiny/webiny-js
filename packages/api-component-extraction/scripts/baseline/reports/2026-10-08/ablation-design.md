# Ablation of the Generate prompt's prohibitions: design

## Decisions (2026-10-08)

- Order approved: five independent prohibitions now, the depth-cap fix next, the three content
  prohibitions after it.
- **The three content prohibitions (10, 11, 12) are unmeasured, not assumed working.** Measured
  against today's clusters they would describe the clusters rather than the lines, and after the
  depth-cap fix some may be unnecessary rather than cuttable. Their deferral is not a backlog item: no
  claim about whether they work exists until they are measured on re-clustered runs.
- Harness: the dry-run mode (option 1). What is measured is what the deployed prompt does.
- Budget: 3 runs per arm, not 6, and five prohibitions, not ten. 3 components x 3 runs = 9 runs per
  arm, which catches a 1-in-6 failure about 81% of the time. That is enough for a delete decision; a
  line cut at that power that later matters comes back cheaply. The "dead" rule below reads 9 runs
  where it says 17.
- **The five, chosen as suspected stale or contradicting:**
  1. **Do not write a hex where a variable is given (1).** It contradicts lines the same prompt now
     carries: "no theme variable is near this colour, use the hex directly" and, since #6, "the theme
     has this colour only as ..., use the hex directly". Contradiction surface.
  2. **Do not substitute a default heading size (2).** Written against the house-heading reflex
     before the type scale stated each step's size and variable; the scale now says the largest step is
     the heading at N px. Suspected redundant.
  3. **Do not centre text this section does not centre (3).** Sits next to "Set text-align explicitly
     to match" and the measured alignments, which brought centring errors to 2 of 90. Suspected
     redundant.
  4. **Rule 17: `list: true`, never `multiple: true` (6).** `multiple` is not an option on any input
     factory in the SDK; the rule forbids a parameter that does not exist, and 0 of 93 outputs use it.
     Suspected stale.
  5. **Use ONLY these theme variables (8).** Validator-backed and suspected ineffective: first
     attempts still invent `--wby-space-*` names in most runs (5 of the 6 latest first attempts). Judged
     on first-attempt failures and attempts.
- Left unmeasured as cheap, uncontested and plausibly load-bearing: rule 11 (just revised and
  verified), rule 13 (`&&`: 0 of 93 outputs render JSX behind it), reading file inputs as `.url`
  (validator-backed, fixed a real defect), the background-image line (new, 15 components), name and
  label.
- Components, one with-arm shared by all five, single-copy so bad clusters cannot contaminate the
  result, three sites and themes: thevibe Hero Intro, Freehill Amenities Highlights, check-run Tulane
  FAQ Section. All three carry every trigger (variable colours, a type scale, non-centred text, list
  props).
- Cost: with-arm 9 generations shared, five without-arms of 9: 54 generations, about $24 at $0.45
  each (range about $20-35 with retries).

## Original design

Design only. Nothing has run, and nothing is cut by this document. It settles, before any run, what
counts as a prohibition surviving, what is measured, on which components, at what cost, and in which
order relative to the clustering fix.

## What is not in scope

- The token list and the worked examples in the shared system prompt. They are shared with every
  caller of `buildComponentPrompt`; an extraction-specific override is its own change.
- Removing anything from the shared system prompt. A system-prompt rule found dead here becomes a
  candidate for the extraction override, not a deletion.

## What counts as surviving: decided before running

Each prohibition P is run in two arms, with P and without it, everything else unchanged, on two named
sets:

- **Bind set:** components where P's trigger is present (the condition P speaks to exists in the
  section), chosen by exposure, not by a past failure.
- **Control set:** components where P's trigger is absent.

| Outcome                       | Rule                                                                                                    | Conclusion                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Load-bearing**              | P's failure appears on at least one bind-set component without P and never with it, over the same runs. | Keep. A failure in one run of six is enough: the cost of wrongly keeping a line is a line, and the cost of wrongly cutting one is a regression on a customer site.                            |
| **Dead (at this resolution)** | Zero failures without P across at least 17 exposed bind-set runs.                                       | Candidate for the extraction override. This bounds the failure rate below 1 in 6 at 95% confidence; it does not prove the rate is zero, and the report must say which resolution was reached. |
| **No information**            | No change on the control set.                                                                           | Expected; it decides nothing.                                                                                                                                                                 |
| **Collateral**                | Removing P changes something else on the control set (another detector, a validation outcome).          | P does more than its stated job. Not cuttable without finding out what.                                                                                                                       |
| **Inconclusive**              | P's failure appears in both arms at a similar rate.                                                     | Model variance, not the line. More runs, or no conclusion.                                                                                                                                    |

**Validator-backed lines are judged differently.** Where a validator enforces P (allowed variables,
invented text, text preservation, rendered values, rendered files), the final output passes either
way, because retries fix it. For these, the outcome is measured on the first attempt's failure rate
and on attempts and cost per component. "Dead" means removing P does not raise them.

**What is measured is the output, not the intermediate.** Each P has a deterministic detector on the
generated source and CSS (below). A detector is checked against a known-failing and a known-passing
component before the run counts. The CSS is part of the artifact (the #6 measure read the JSX only and
came out 1 of 63 instead of 59 of 63).

## Inventory

Exposure counts are over the 95 stored plans (baseline and check runs). "Contract-dependent" means
the failure P guards against comes from content the contract should not have had, which is what the
depth-capped cluster fingerprint produces
(`ai-context/issues/a-depth-capped-fingerprint-sees-only-wrappers.md`).

| #   | Prohibition                                                                  | Source              | Guards against             | Detector                                           | Validator-backed        | Exposure | Contract-dependent |
| --- | ---------------------------------------------------------------------------- | ------------------- | -------------------------- | -------------------------------------------------- | ----------------------- | -------- | ------------------ |
| 1   | Do not write a hex where a variable is given                                 | extraction          | hardcoded colours          | measured hex literal where a variable was offered  | no                      | 92       | no                 |
| 2   | Do not substitute a default heading size                                     | extraction          | house heading (~33px)      | largest rendered size vs `typeScale[0]`            | no                      | 86       | no                 |
| 3   | Do not centre text the section does not centre                               | extraction          | reflex centring            | dominant `text-align` vs source (the 2/90 measure) | no                      | 42       | no                 |
| 4   | Rule 11: class names, inline style only for runtime values                   | system              | inline styling             | `style=` with non-runtime values                   | no                      | all      | no                 |
| 5   | Rule 13: ternary with null, never `&&`                                       | system              | `0`/`""` rendered          | `&&` in JSX expressions                            | no                      | 79       | no                 |
| 6   | Rule 17: `list: true`, never `multiple: true`                                | system              | broken list inputs         | `multiple: true` in manifest                       | no                      | 64       | no                 |
| 7   | Read a file input as `.url`, `logo.src.url`                                  | extraction + system | `[object Object]` src      | rendered-values validator                          | yes                     | 36       | no                 |
| 8   | Use ONLY these theme variables                                               | extraction          | invented `--wby-*`         | token-binding validator                            | yes                     | all      | no                 |
| 9   | Do not replace a background image with a flat colour / keep colour and image | extraction          | lost backgrounds           | background-image present with its URL              | no                      | 15       | no                 |
| 10  | Show no other text; do not add a heading, button, caption                    | extraction          | invented content           | invented-text validator                            | yes                     | all      | **yes**            |
| 11  | Do NOT invent image URLs; no stock photography                               | extraction          | stock and placeholder URLs | URL not in the allowed set                         | partly (rendered files) | 50       | **partly**         |
| 12  | Use these URLs exactly as given                                              | extraction          | substituted images         | URL not in the allowed set                         | partly                  | 50       | **partly**         |
| 13  | Name and label exactly as given                                              | system              | renamed components         | manifest name/label vs plan                        | no                      | all      | no                 |

## Size and cost

Per prohibition: a bind set of 3 components, 6 runs per arm, 18 runs per arm. 18 exposed runs meet
the 17 needed for the "dead" bound; the chance of missing a 1-in-6 failure is (5/6)^18, about 4%.
Three runs per arm would miss it about 19% of the time, which is too weak to call anything dead.

At about $0.45 per generation including retries: 36 generations, about $16 per prohibition. The
with-P arm can be shared between prohibitions whose bind sets overlap, so the independent group (10
prohibitions) is about $120-160, not $160 plus. The contract-dependent group (3) is about $50.

## Harness: a decision

Ablated generations must not overwrite the stored components, or a run shows a component generated
without a rule. Two options:

1. **A dry-run mode** for per-component Generate: generate and validate, record to the generation log
   marked as an experiment, store the output beside the component instead of replacing it. Takes an
   `ablate` list of prohibition ids, accepted only in a development environment. Reusable for any
   later prompt experiment. Needs the prohibitions given stable ids in the prompt builders.
2. **A local harness** that builds the same prompt and calls the same model with the same image,
   then runs the same validators locally. No API change. It needs a model key locally, and it drifts
   from the deployed path unless it imports the same functions.

Recommended: 1. It measures the path that ships, and the experiment marker keeps it out of the run's
results.

## Sequencing against the clustering fix

Three of the thirteen (10, 11, 12) guard against content that comes from contracts carrying other
copies' material, and their bind sets are drawn from the 44 multi-copy components, which overlap with
the 34 whose fingerprint sees only wrappers. Measured now, they would be measured against contracts
the depth-cap fix will change. Some of what they guard may stop arising, which makes them irrelevant
rather than cuttable, and a "load-bearing" result now would describe the bad clusters, not the line.

The other ten are independent of contract content (styling, tokens, syntax, alignment, size, input
handling). Their results would stand after the clustering fix.

Recommended order:

1. The ten independent prohibitions now.
2. The depth-cap fingerprint fix: replay over every run's trees, report how clusters split and merge,
   then re-plan.
3. The three contract-dependent prohibitions, on the re-clustered runs.
