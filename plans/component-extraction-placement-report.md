# Component Extraction: placement — diagnosis

Diagnosis only. Nothing changed in the capture, the contract or the prompt.

Measured on the current runs — 50 components across the four demo sites, 47 with a successful render.
The question for each concern is which of three cases holds: (1) the information does not exist in the
capture, (2) it exists and never reaches the prompt, (3) it reaches the prompt and the model does not
follow it.

## The answer

| concern                            | case                                  | scale                                                      |
| ---------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| **Alignment**                      | **2 — captured, read by nothing**     | 28 of 45 sections with an alignment lose it or get centred |
| **Arrangement (where the gutters)** | **2 — derivable from boxes, discarded** | 10 of 17 side-by-side sections rearrange                  |
| **Arrangement (the CSS mechanism)** | **1 — not captured at all**           | `flex-direction`, grid tracks, `flex-wrap`, `justify-content` |

**Neither concern is case 3.** Neither prompt contains a single occurrence of *column*, *align*,
*layout*, *grid*, *flex*, *gap*, *stack* or *contained*. The model is not being told and then ignoring
it.

**The direction is the opposite of what the first pass reported.** Measured with one definition
applied to both sides, renders carry **more** side-by-side structure than their sources, not less: 29
source gutters against 41 render gutters, 13 components with more and 2 with fewer. The "six column
collapses" in `component-extraction-colour-placement-background-report.md` do not survive a measure
that treats both sides alike. That finding is withdrawn below, with the reason.

---

## W1. The inputs

### What the capture records

`STYLE_PROPS` in `captureEvaluator.ts` records eighteen properties on every node. The layout ones are
`textAlign`, `display`, `gap`, `paddingLeft`, `paddingTop`, `marginTop` and `position`, and every node
carries a measured box.

**What it does not record is the half that says how a container lays out:** `flex-direction`,
`grid-template-columns`, `grid-template-areas`, `justify-content`, `align-items` and `flex-wrap` are
all absent. So the pipeline knows a node is `display: flex` and does not know whether it is a row.

That split matters for the fix. The *facts* of an arrangement — how many columns, where the gutters
fall, how wide the content is — are derivable from the boxes, which are captured. The *mechanism* is
not captured at all.

### What reads it

Nothing. One consumer reads `styles` anywhere in the pipeline — `sectionShape.collectColors`, reading
the three colour properties, which the colour fix has now carried through to Plan. No layout property
is read by anything.

`geometryClass` — full-bleed versus contained, plus a column count derived from the children's
vertical bands — is computed in Cluster and lives inside `SectionShape`, which is not persisted. The
pipeline works out whether a section is full-bleed and how many columns it has, and keeps neither.
This is the same shape as the colour finding, in the stage that already proved it.

### What reaches the prompts

Searched both prompt builders for *column*, *align*, *layout*, *grid*, *flex*, *side by side*,
*arrangement*, *stack*, *full-bleed*, *contained* and *gap*. **Zero occurrences in either.**

Generate receives the component type and name, the reference crop, the prop list, the token bindings,
the allowed theme variables, the measured type scale, the measured colours, the text to preserve and
the observed images and destinations. It receives nothing about where anything goes.

---

## W2. The divergence

### Alignment: 9 centred against the source, 19 left undeclared

Measured from the capture tree against the generated CSS — DOM on one side, code on the other, so
this measure does not depend on pixels at all. The source alignment is the area-weighted dominant
`textAlign` over the section's text-bearing nodes; the render's is the dominant `text-align` the
generated CSS declares.

| | count |
| --- | ---: |
| source and CSS agree | 17 |
| **they differ** | **9** |
| **source has an alignment, the CSS declares none** | **19** |

**Every one of the nine differences centres something the source did not centre.** Not one goes the
other way.

```
Park city Palace  Property Description             left  -> center
Park city Palace  Accessibility Statement          left  -> center
Park city Palace  Application Form                 left  -> center
2424 Tulane       Footer with address, office hours right -> center
2424 Tulane       Site Footer with Contact Info     right -> center
2424 Tulane       Apply Now CTA with Address        left  -> center
71 Westland       Hero Intro                       left  -> center
71 Westland       Footer with contact info          right -> center
Freehill          Property Contact & Office Hours   right -> center
```

Five of the nine are right-aligned footers becoming centred. Centre is what a model writes when
nothing tells it otherwise, and the 19 undeclared cases are the same reflex with the browser default
instead of an explicit rule.

### Arrangement: gutters move and multiply, they do not disappear

An arrangement is a set of vertical gutters at particular places. Both sides are screenshots at
1440px, both are reduced to ink with the same thresholds, and what is compared is **where** the
gutters are — a gutter that moves a little is the same arrangement, a gutter that is gone is not.

**14 of 47 sections are 40% or more photograph and are excluded**, because on those ink says nothing
about layout (see the method note). Of the 33 that remain:

| | count |
| --- | ---: |
| side-by-side sources | **17** |
| &nbsp;&nbsp;kept — every gutter within 8% of where it was | 6 |
| &nbsp;&nbsp;partly kept — some gutters lost | 5 |
| &nbsp;&nbsp;rearranged — gutters exist, none line up | 5 |
| &nbsp;&nbsp;stacked — the render has no gutter at all | 1 |
| single-column sources | **16** |
| &nbsp;&nbsp;flat, stays flat | 14 |
| &nbsp;&nbsp;the render invents a split | 2 |

**The one "stacked" is a false positive.** 2424 Tulane's _Accessibility Statement_ is a single column
of prose with a decorative half-circle at the right edge; the gap between the text and the decoration
reads as a gutter at 79%, and the render has no decoration. There is no verified stack in the
measurable set.

Direction, over the same 33:

- **29 gutters in the sources, 41 in the renders.** 13 components have more than their source, 2 have
  fewer, 18 the same number.
- 12 source gutters have no counterpart; **19 render gutters are invented**.
- Of the 17 gutters that survive, the median moves **4% of the width**.

The clearest case is 71 Westland's _Site Header Navigation_. The source is a logo on the left and two
buttons on the right with one gutter at 48%; the navigation itself is behind a hamburger. The render
spells the navigation out inline — HOME, AMENITIES, FLOOR PLANS, GALLERY, LOCATION, RESIDENTS,
CONTACT, FENWAY CDC — which puts gutters at 22% and 70%. The model is adding structure the source
holds closed, not collapsing structure the source holds open.

---

## W3. Attribution

**Alignment — case 2.** `textAlign` is captured on every node, appears as `start`, `center`, `left`
and `right` across all four sites' trees, and is read by nothing. Neither prompt mentions alignment.
Nine renders centre what the source does not and nineteen declare nothing.

**Arrangement, the facts — case 2.** The boxes are captured. Column counts and gutter positions follow
from them, and `geometryClass` already derives part of it in Cluster and throws it away with
`SectionShape`.

**Arrangement, the mechanism — case 1.** `flex-direction`, `grid-template-columns`, `flex-wrap` and
`justify-content` are not in `STYLE_PROPS`. A fix that wants to say "three equal columns with a 32px
gutter" has to derive it from boxes, or the capture has to grow.

**Neither is case 3.** Nothing about placement reaches either prompt, so a stricter instruction has
nothing to be stricter about.

---

## The finding that is withdrawn

The first diagnosis reported *13 of 34 differ in arrangement, of which six collapse a multi-column
section into a single column*, and named the six. **That is an artefact of the measure and does not
reproduce.**

The first measure counted any full-height gap in the source crop as a column boundary and compared
counts. It had two flaws that pointed the same way: a navigation bar's inter-item gaps counted as
columns, inflating the source's count; and nothing required a gutter to hold across the rows it
separated, so photographic texture counted too. Both inflate the source side, and the render side was
measured the same way but on simpler, flatter images — so the source looked more structured than the
render by construction.

Five of the six named collapses do not survive. _Property Description_, _Hero Introduction Section_,
_Freehill Hero Banner_, _Contact Form with Map View_ and _Privacy Policy_ are either photographic
sections where ink cannot measure layout, or sections whose arrangement the render in fact keeps. The
sixth, _Site Header Navigation_, is real but is the opposite defect: the render has **more**
structure, not less.

## Method note: six definitions, and why the sixth is the one

Each definition was checked against the images before any number was reported, and five were
falsified that way.

1. **Any full-height gutter, counts compared.** A navigation bar's inter-item gaps are columns. `5 -> 7`
   is the noise floor, not a finding.
2. **Source from element boxes, render from ink.** Boxes include padding; ink does not. Park city's
   footer read 3 source columns and 1 render column while plainly showing content side by side.
3. **Both sides as masks, source still from boxes.** The same flaw reversed: adjacent boxes in a
   three-up grid touch, so a 24px card gutter vanished and a card row read as one column while the
   render's ink showed three.
4. **Both sides as ink, columns per row.** A photograph's ink breaks into runs on every row and they
   do not line up, so one full-width photo of hands on a desk read as 48% side by side.
5. **Both sides as ink, columns per band with a 43px bridging gap.** Right idea, wrong statistic.
   Freehill's _Amenities Highlights_ keeps its image-left / text-right arrangement exactly, but its
   gutter narrows from 70px to 18px, and the count turned a narrower gutter into "stacked".
6. **Gutter positions, per band, both sides as ink, photographic sections excluded.** What is compared
   is where the gutters are, so a gutter that moves is the same arrangement and only a gutter that is
   gone is a loss.

Two limits of the sixth, stated because each hides a real case:

- **14 of 47 sections cannot be measured this way at all.** Ink on a photograph is not layout.
  Excluding them also excludes a genuine failure: 2424 Tulane's _Category Navigation Menu_ is a dark
  sidebar beside a full-width map in the source and a narrow centred stack in the render — a real
  collapse, in a section that is 69% media.
- **A decoration at an edge reads as a column.** That is the one remaining "stacked" verdict.

Both say the same thing, and it is the conclusion the proportion pass already reached: **pixels cannot
measure arrangement.** The render side needs measured geometry from the rendered DOM, the way
`SectionGeometry` already carries `contentLeft`, `contentRight` and the font sizes. Until it does, any
arrangement number carries a 14-of-47 blind spot.
