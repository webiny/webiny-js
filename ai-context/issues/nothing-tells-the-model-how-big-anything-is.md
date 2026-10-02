# Nothing tells the model how big anything is, and nothing checks the result

> **Package:** `@webiny/api-component-extraction` (`componentGeneration`, `validators`)
> **Severity:** medium — affects the in-band majority. 20 of 34 components are the right rough size
> and still visibly off: type a size small, padding short, gutters wrong, content vertically
> misplaced. No component reviewed across the four sites was a faithful reproduction.
> **Status:** open. Diagnosed in `plans/component-extraction-visual-fidelity-report.md`.

## What the prompt gives the model

`buildPrompt` emits, in full:

- **"Reproduce the section shown in the reference image."** — one sentence, with the crop attached.
- the prop list, each with up to three observed values
- the theme CSS variables to use, as a hard allow-list
- **"Preserve this text content exactly:"** and the text list
- on a retry, the previous attempt's validation failures verbatim

That is the entire description of how the component should look: one picture and one sentence.

## What it does not give

**Any measurement at all.** Capture records each node's box and a token-relevant computed-style
subset — `CapturedNode.styles` is documented as "background, color, font, spacing, radius" — and
neither the box nor the styles reaches the prompt. The model is never told:

- the section's height, or that `representative.box` exists
- any type size, weight or line height
- any padding, gutter or vertical rhythm
- whether the section is full-bleed or contained (Cluster computes exactly this as
  `geometryClass`: `width >= 0.9 * viewportWidth ? "full" : "contained"` — and keeps it to itself)
- what its images are (see `image-values-are-captured-and-never-derived`)

## What nothing checks

The three validators are `validateTextPreservation`, `validateContractConformance` and
`validateTokenBinding`. **None of them looks at appearance.** They are also the only thing the retry
loop can react to, and the retry loop is described in the code as

> the single biggest lever on both pass rate and wasted attempts

so the lever exists, is strong, and is attached to everything except the subject of this issue. A
component whose proportions are wrong is re-rolled only if its text or tokens are also wrong, and a
retry that fixes the text has no reason to improve the layout.

## What it looks like

Park city Palace _Hero Banner_ — structure, colour and CTA colour all correct, same eyebrow, heading
and button label:

- heading visibly smaller than the source's
- button padding much shorter — the CTA is roughly a third of the source's height
- left gutter **36px against the source's 115px**
- the content block sits lower in the frame than the source's

Park city Palace _Property Highlights Grid_ is the most faithful component in the whole set — three
columns, olive headings, olive buttons, correct labels, image aspect close — and still differs on
type scale, button padding and background tint.

Freehill _Hero Banner_ reproduces the centred two-line heading and the slide dots, and places its
text block at ~70% of the frame height where the source has it at ~46%.

This is what a prompt with no measurements produces: the model reads structure and colour off the
crop accurately, and guesses everything dimensional.

## Ordering

Lower priority than `a-component-must-contain-every-section-it-clusters-with`. Fixing proportion
first yields well-proportioned components that still contain four other sections.

---

## The distribution, measured

Measured across all four sites on the current runs (33 generated components), comparing each source
section crop with its rendered component. Both are 1440px wide, so a horizontal measurement on one is
directly comparable with the other.

**The method, and what it cannot do.** The captured node trees hold exact geometry and are not
reachable over HTTP — the run-image route serves images only — so this is measured from the images.
An earlier attempt measured "first column containing ink" and was wrong: a full-bleed photograph is
ink in every column, so it measured the section background rather than the content inset. Two
measures are used instead, each reporting which pairs it can speak for:

- **Flat-background sections** (one tone covers ≥35% of pixels): content inset, content width and
  median inked-row-run height, against the background tone. 22 of 33 qualify.
- **Photo-dominated sections**: the same, against a near-white mask, which isolates overlay text —
  usable only where that mask stays sparse on both sides. 12 of 33 qualify.

The two overlap on 6, so **28 of 33 components are measured by at least one method**. The 5 that are
measured by neither are Park city Palace _Property Highlights Grid_, 2424 Tulane _Site Header
Navigation_, _Specials Section_ and _Location Description_, and 71 Westland _Contact Section_.

### There is no consistent direction

|                                    | n   | median   | min  | max  | smaller | about right | larger |
| ---------------------------------- | --- | -------- | ---- | ---- | ------- | ----------- | ------ |
| **text sections** — line height    | 10  | **1.07** | 0.77 | 2.25 | 1       | 5           | 4      |
| **text sections** — content width  | 10  | **0.99** | 0.64 | 1.01 | 1       | 9           | 0      |
| **photo sections** — line height   | 12  | **1.33** | 0.25 | 3.33 | 5       | 1           | 6      |
| **photo sections** — left inset    | 12  | **1.22** | 0.17 | 3.13 | 3       | 2           | 7      |
| **photo sections** — content width | 12  | 0.99     | 0.44 | 3.24 | 5       | 4           | 3      |

(Line height is restricted to pairs with at least five inked row-runs on both sides. A section that is
one photograph has a single run covering most of its height, and its "median line height" is the
height of the picture — which produced ratios of 65 and 0.03 before the restriction.)

**Text sections are close.** Content width is right in 9 of 10, line height sits at 1.07, and the
whole spread is 0.77–2.25 with one outlier.

**Photo sections drift hard, in both directions.** The same measure that gives Park city Palace's
_Hero Banner_ a left inset of **0.32x** (117px → 38px) and a line height of **0.25x** gives 2424
Tulane's _Hero banner with CTA_ **3.13x** (112px → 350px) and **2.35x**, and Freehill's _Hero Banner_
**1.93x** and **3.33x**.

### This corrects the diagnosis

The original diagnosis read the drift as **consistent under-scaling** — "type a size small, padding
short", from a 36px gutter against the source's 115px. That observation was accurate and it was one
component. Park city Palace's hero really is roughly four times too tight. It is not a direction: of
the 12 photo sections, 3 are tighter, 7 are looser and 2 are right, and line height splits 5 smaller
against 6 larger.

The drift is **large and undirected**, which is a different problem from a systematic bias and has a
different fix. A prompt told to "use larger type" would make the already-too-large half worse. What
unconstrained guessing looks like is scatter, and this is scatter.

### What the pipeline holds and does not send

`captureEvaluator.ts` records **18 computed properties on every node**:

```
backgroundColor, color, fontFamily, fontSize, fontWeight, lineHeight, letterSpacing,
borderTopColor, borderTopWidth, borderRadius, boxShadow, paddingTop, paddingLeft,
marginTop, gap, display, textAlign, position
```

plus a measured `box` on every node.

**Three of the eighteen are ever read.** `sectionShape.ts` reads `backgroundColor`, `color` and
`borderTopColor`, to resolve the section's colours to theme tokens. Nothing reads `fontSize`,
`lineHeight`, `letterSpacing`, `paddingTop`, `paddingLeft`, `marginTop`, `gap` or `textAlign` — the
nine that describe proportion — and none of them, nor any box, reaches the generation prompt.

So the answer to "what do the prompt and the contract tell the model about measurements" is: nothing,
and not because the measurements were never taken. They are captured on every node of every page and
dropped one stage later.
