# Effort: result

Design and predictions: `effort-design.md` (committed before the runs). 30 dry-run generation runs,
5 components x 3 arms x 2 repeats, on `anthropic/claude-sonnet-5`, all arms at the same moment.

## Per arm (10 generation runs each)

| Arm             | First-attempt pass | Generated | Attempts | Timed-out calls | Colour flags | Type flags | Spacing fidelity | Median duration | Output tokens | Cost reported |
| --------------- | ------------------ | --------- | -------- | --------------- | ------------ | ---------- | ---------------- | --------------- | ------------- | ------------- |
| high (default)  | 9/10               | 9/10      | 1.20     | 3               | 0            | 1          | 0.94             | 178s            | 146,705       | $2.52         |
| medium          | 10/10              | 10/10     | 1.00     | 0               | 0            | 1          | 0.93             | 100s            | 108,893       | $2.08         |
| low             | 10/10              | 10/10     | 1.00     | 0               | 2            | 3          | 0.97             | 28s             | 41,718        | $1.07         |

Reported cost excludes the three timed-out calls, which report no usage: at about 30K tokens each,
roughly $1.35 more on the high arm. Total reported $5.67 against an estimate of $10-14.

## What each flag is (read in the outputs, not taken from the counts)

- **Footer type flag: not effort.** The Footer's heading is 45px against a measured 16px at high, and
  flags at every effort. A Footer defect that exists at the default.
- **Control spacing: effort.** Social Media Links writes its 15px container padding as a gap at medium
  (2 of 2 runs) and low (1 of 2), not at high (0 of 2). The value is present; the kind is wrong.
- **Low's colour and type flags: effort.** Hero Intro writes text `#1a1a1a` and Amenities `#ffffff` as
  literal colours where a theme variable is given; one Amenities heading is 32px against a measured
  45px. 3 flags in 4 low runs on these two components, 0 in their 8 high and medium runs.

## Against the predictions

1. **Confirmed.** Duration and output fall with effort on Site Header (178s, 117s, 24s on average),
   Footer (281s and a full timeout, 174s, 46s) and Hero Intro (205s, 137s, 36s).
2. **Confirmed.** No Site Header or Footer attempt timed out at medium or low. At high the Footer timed
   out on all three attempts of its second repeat: the component was not generated.
3. **Confirmed, at the edge.** Answers are within 30% across arms, but low is shorter on every long
   component: Hero Intro -29%, Site Header -25%, Amenities -22%, Footer -16%. What is left out was not
   measured.
4. **Failed on one check.** Medium is within high's spread on every check except the control's spacing
   (0.67 twice against 1.00 twice).
5. **Failed.** The control's spacing changed at medium and at low.
6. **First-attempt failures did not rise at low** (10/10), but colour and type flags did (above).

**Prediction 6 failed in the instructive direction.** Low passed 10 of 10 first attempts and produced
worse components: literal colours where it was given a variable, a heading at 32px against a measured
45px. A validator-based quality measure cannot see that; it is the same gap as the 63% finding.
Anyone revisiting this decision will reach for pass rates first, and pass rates say low is the best
arm. Quality here was read from the colour, type and spacing checks, in the outputs.

Props a contract carries were not measured: Plan is the same in every arm by construction, so the check
cannot move in a dry-run Generate.

## The decision rule does not select

The rule adopts the lowest effort whose quality checks are within the high arm's own repeat spread on
every component. **No arm meets it.** Low adds colour and type defects on two components. Medium differs
from high on one check, on the control. And high fails the two checks the rule did not anticipate it
failing: first-attempt pass and attempts per component, through timeouts, with one component not
generated at all.

Two repeats find large regressions, not small ones. At this resolution: low regresses colour and type;
medium differs from high only in the control's container padding; high times out.
