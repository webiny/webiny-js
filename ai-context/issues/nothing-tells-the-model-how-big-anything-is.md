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
