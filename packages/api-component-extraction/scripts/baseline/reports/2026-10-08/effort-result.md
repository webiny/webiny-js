# Effort: result

> **For a future comparison:** since this decision, an unset effort means **medium**
> (`GENERATION_EFFORT`), not the provider's default. An arm meant to reproduce this experiment's
> `effort-high` must pass `effort: "high"` explicitly; left unset it silently runs medium and the
> comparison is void. Every generation-log entry since 2026-10-08 records the effort its call sent.

Design and predictions: `effort-design.md` (committed before the runs). 30 dry-run generation runs,
5 components x 3 arms x 2 repeats, on `anthropic/claude-sonnet-5`, all arms at the same moment.

## Per arm (10 generation runs each)

| Arm            | First-attempt pass | Generated | Attempts | Timed-out calls | Colour flags | Type flags | Spacing fidelity | Median duration | Output tokens | Cost reported |
| -------------- | ------------------ | --------- | -------- | --------------- | ------------ | ---------- | ---------------- | --------------- | ------------- | ------------- |
| high (default) | 9/10               | 9/10      | 1.20     | 3               | 0            | 1          | 0.94             | 178s            | 146,705       | $2.52         |
| medium         | 10/10              | 10/10     | 1.00     | 0               | 0            | 1          | 0.93             | 100s            | 108,893       | $2.08         |
| low            | 10/10              | 10/10     | 1.00     | 0               | 2            | 3          | 0.97             | 28s             | 41,718        | $1.07         |

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

## The render check on the control (medium against default)

Each of the four control outputs (two per arm) rendered with its own defaults on the site's theme
values, at 1440px, and measured in the browser. The site's own geometry is read from the captured page
tree of the representative section.

|             | Site                             | Default (2 runs)                           | Medium (2 runs)                 |
| ----------- | -------------------------------- | ------------------------------------------ | ------------------------------- |
| Icon circle | 45px, padding 0                  | 45px                                       | 47px (content-box + 1px border) |
| Icon glyph  | a font icon at font-size 15-16px | 13px: squeezed by 15px padding on the link | 18-20px                         |
| Text inset  | 60px                             | 60px                                       | 60px                            |

**The difference is visible**: medium's glyphs are clearly larger. Neither arm matches the site: default
is 2-3px under it, medium 3-4px over, and medium's circle 2px wide.

**The spacing check scored the wrong element and ranked the worse output first.** The 15px the site
measured as container padding is its grid-column padding (45px row padding plus 15px column padding:
the 60px text inset both arms reproduce). Default "kept" it by padding the icon link, which the site
does not pad, which squeezed its glyph to 13px, and scored higher for it. Medium wrote 15px as a gap
and scored lower. The check did not merely miss: it confirms a declaration of the right kind, not on
the right element, and here that preferred the worse output.

**Decision: medium.** Neither arm matches the site's icons (default 2-3px under, medium 3-4px over and
2px on the circle), so the quality difference is a wash. What default costs is a component that does
not generate.

## Noise in this comparison, recorded 2026-10-09

The Footer, regenerated on one prompt that hashes identically across attempts, billed 8,137 output
tokens once and 27,462-28,383 three times. The answer was the same size each time (18.6-21.6K
characters); the difference was thinking, first text after 5 s once against 210-232 s three times. All
four passed. See `2026-10-09/footer-per-call-limit.md`.

**What that means for this comparison.** One component varied 3.5× in cost and 4× in time run to run on
identical input, at one effort setting. Part of the medium-versus-default comparison above was that
noise read as signal: per-component differences between arms smaller than this swing are not evidence
on their own.

**The decision stands.** Medium rested on timeouts as much as quality: the default ran the Header and
Footer into the per-call limit, medium did not. This note qualifies the cost and quality figures, not
the choice.
