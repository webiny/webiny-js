# Text alignment is captured and never passed

> **Package:** `@webiny/api-component-extraction` (Plan, Generate)
> **Severity:** medium — 11 of the 45 sections across the four demo sites that have a measured
> alignment render with the wrong one. Nine centre text their source does not centre; two render left
> because nothing was declared and the source was not left.
> **Status:** fixed in Plan + Generate. Diagnosed in `plans/component-extraction-placement-report.md`.

## What happens

`textAlign` is one of the eighteen properties `STYLE_PROPS` records on every captured node. It appears
as `start`, `center`, `left` and `right` across all four sites' trees. **Nothing reads it**, and
neither the Plan prompt nor the Generate prompt contains the word _align_.

Measured by comparing the capture tree's area-weighted dominant alignment against the dominant
`text-align` the generated CSS declares — DOM on one side, code on the other, no pixels:

|                                          |                                     count |
| ---------------------------------------- | ----------------------------------------: |
| source and CSS agree                     |                                        17 |
| **CSS centres what the source does not** |                                     **9** |
| CSS declares nothing                     | 19, of which **2** have a non-left source |

**Every one of the nine goes the same way.** Four right-aligned footers, three left-aligned bodies, a
CTA and a hero intro, all centred. Not one disagreement runs the other direction.

## What it is not

**The 19 undeclared are mostly not a defect.** `text-align` defaults to left, so a left-aligned
section that declares nothing renders correctly, and 17 of the 19 are left-aligned sources. Counting
them as failures would have aimed the fix at 28 sections when the real number is 11. Only two are
silent failures: 2424 Tulane's _Contact Form_ (source centre) and 71 Westland's _Site Header
Navigation_ (source right).

## Why nothing flagged it

The sources are **left 23, centre 16, right 6**. Centring is right about a third of the time, so the
model's default produces a plausible result often enough that no signal separated it from a derived
one — the same reason a house heading of ~2rem looked like a decision rather than a default.

## The fix

Plan derives `textAlignments` from the node it already resolves for value binding, and Generate names
it in the prompt. **The contract and the Plan prompt are untouched**: an alignment is a measured fact
with nothing for Plan's model to choose, unlike a colour, which needed Plan because Plan picks the
token bindings. That is a narrower change for a specific reason, not for convenience.

A **distribution ordered by text area**, not a single dominant value. Park city's _Site Footer_
measures `right 5 (57% of the text area), center 7 (39%), left 2 (4%)` — naming one alignment for that
section would produce the mirror of the defect being fixed.

## Why there is no validator, deliberately

The colour fix narrowed the token-binding validator alongside the prompt, because "wrote a hex where a
variable was given" is unambiguous. **Alignment has no equivalent, and a validator here would do
harm.**

- A section with two alignments correctly declares two. A rule requiring the dominant one would fail
  the footer above for being right.
- A rule requiring any explicit `text-align` would fail **the 17 benign undeclared cases**, which
  render correctly because left is the default. It would turn 17 correct components into retries.
- The mirror risk is real and asymmetric: 16 of 45 sources are centred, so a validator pushing away
  from centre breaks more than it fixes.

**Do not add one without a measure that separates the 11 real defects from the 17 benign cases.** The
measure that does exist — tree against generated CSS — is an acceptance measure, not a per-component
gate, because it needs the capture tree, which Generate does not hold.

## Where it sits in the pattern

The fourth value of this shape: image sources, link destinations, type sizes, and now alignment. Each
one captured correctly, carried one stage, dropped before the stage that needed it, with the model
filling the gap from its own defaults — a stock photo, a 33px heading, `text-align: center`. See
`ai-context/code-style/persist-what-a-later-stage-needs.md`.
