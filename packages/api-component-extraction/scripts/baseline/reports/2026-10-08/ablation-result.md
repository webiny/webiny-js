# Ablation of five Generate prohibitions: result

Design and decisions: `ablation-design.md`. 54 generations through the deployed prompt in dry-run
mode (`f97f49b029`), $22.92. Three components, each single-copy, from three sites and themes:
thevibe Hero Intro, Freehill Amenities Highlights, check-run Tulane FAQ Section. One arm with every line
(base), five arms each without one line, three runs per component per arm: 9 runs per arm. No stored
component changed; the experiments are logged as experiments.

**Scope of every conclusion below.** The five were measured only on components whose contracts fit
their sections (single-copy, so no other copy's content in the contract). "Dead" means: zero failures
without the line in 9 exposed runs, which catches a failure that occurs one run in six about 81% of
the time. It bounds the rate on these three components; it does not show the rate is zero, and it does
not show the line is dead on other components.

## Results

Failures per arm, detected on each run's final output (first-attempt failures for line 5). `*` marks
the line removed in that arm.

| Arm                    | Hex literal | House heading | Mainly centred | `multiple: true` | First attempt: unknown variable | Mean attempts | Passed | Cost  |
| ---------------------- | ----------- | ------------- | -------------- | ---------------- | ------------------------------- | ------------- | ------ | ----- |
| base (all lines)       | 0/9         | 0/9           | 0/9            | 0/9              | 9/9                             | 2.00          | 9/9    | $3.67 |
| without hex            | 0/9 *       | 0/9           | 0/9            | 0/9              | 8/9                             | 1.89          | 9/9    | $3.61 |
| without heading size   | 1/9         | 0/9 *         | 0/9            | 0/9              | 7/9                             | 1.78          | 9/9    | $3.62 |
| without centring       | 1/9         | 0/9           | 0/9 *          | 0/9              | 7/9                             | 2.00          | 7/9    | $4.10 |
| without `multiple`     | 1/9         | 0/9           | 0/9            | 0/9 *            | 8/9                             | 1.89          | 9/9    | $3.62 |
| without only-variables | 3/9         | 0/9           | 0/9            | 0/9              | 9/9 *                           | 2.22          | 7/9    | $4.31 |

Detectors were checked before the runs against the 93 stored outputs (hex fires on 4, heading on 5,
centring on 5; `multiple` has no real failure in the data and was checked on a constructed string).
The hex detector was corrected before use to match by role: `#ffffff` offered as a border and
background colour is not a violation when used as text.

## By line

1. **Do not write a hex where a variable is given: dead at this resolution.** 0/9 without it. Hex
   literals did appear in arms that kept the line (6 of 45 runs), so the line was not what kept them
   out where they were absent. It also contradicts the prompt's own "use the hex directly" lines.
2. **Do not substitute a default heading size: dead at this resolution.** 0/9 without it and 0/9 in
   every arm: the type scale, which states the heading's size, carries what this line was written for.
3. **Do not centre text the section does not centre: dead at this resolution.** 0/9 without it. Two
   runs of that arm did not pass, both on invented `--wby-space-*` variables over three attempts, not
   on centring; at 2 in 9 against 0 in 9 that is not distinguishable from variance.
4. **Rule 17, never `multiple: true` (both statements): dead at this resolution.** 0/9 without it,
   0 of 93 stored outputs, and no input factory in the SDK takes `multiple`.
5. **Use ONLY these theme variables: does not do its stated job, and is not cuttable.** Its target
   failure, an invented variable on the first attempt, occurs in 9 of 9 base runs with the line
   present and 9 of 9 without it. Removing it is not neutral, though: hex literals rise to 3/9 (0/9
   with it), 2 runs fail to pass (0 with it), and attempts and cost rise (2.22 against 2.00; +17%).
   That is the "side effects" outcome: the line does something besides its stated job, plausibly its
   second clause ("for anything without a suitable variable, use a plain CSS value"), and the numbers
   are too small to say which. Rewording it without knowing that would be guessing.

## What the base arm shows

Every first attempt in the base arm, 9 of 9, fails on invented spacing variables
(`--wby-space-sm/md/lg/xl/2xl/3xs`), and every component therefore pays at least one retry: a mean of
2.00 attempts. That is roughly half of Generate's spend, on every component, with the prohibition in
place. It is a better target than any of the five lines: the cause is why the model reaches for a
t-shirt spacing scale the theme does not have, not the wording of a prohibition it already ignores.

## Unmeasured

The three content prohibitions (show no other text; do not invent image URLs; use these URLs exactly
as given) remain unmeasured, not assumed working. See the design for why they wait for the depth-cap
fix.
