# Component Extraction: placement — diagnosis

Diagnosis only. Nothing changed in the capture, the contract or the prompt.

Measured on the current runs — 50 components across the four demo sites, 47 with a successful render.
The question for each concern is which of three cases holds: (1) the information does not exist in the
capture, (2) it exists and never reaches the prompt, (3) it reaches the prompt and the model does not
follow it.

## The answer

| concern                            | case                                  | scale                                                      |
| ---------------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| **Alignment**                      | **2 — captured, read by nothing**     | 11 of 45 sections render with the wrong alignment          |
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
| source has an alignment, the CSS declares none | 19 |

**Every one of the nine differences centres something the source did not centre.** Not one goes the
other way.

**The 19 undeclared are mostly not a defect, and must not be counted as one.** `text-align` defaults
to left, so a left-aligned section that declares nothing still renders left. **17 of the 19 are
left-aligned sources.** Only two are silent failures:

```
2424 Tulane   Contact Form             source center, CSS declares nothing  -> renders left
71 Westland   Site Header Navigation   source right,  CSS declares nothing  -> renders left
```

So the defect is **11 of the 45 sections that have a measured alignment** — nine centred against the
source and two silently left — not 28. Stated plainly because the first version of this report
grouped all 19 with the nine, which is the shape of error
`true-but-misleading-groupings` exists to catch: the grouping was accurate and implied a cause it did
not have.

For scale, the sources themselves are **left 23, centre 16, right 6**. Centring is right about a
third of the time, which is why the reflex is not obviously wrong and why nothing flagged it.

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

Four of the nine are right-aligned footers becoming centred. Centre is what a model writes when
nothing tells it otherwise.

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
Nine renders centre what the source does not, and two more render left because nothing was
declared and the source was not left.

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

---

# Acceptance: the alignment fix

Plan derives `textAlignments` from the node it already resolves for value binding; Generate names it.
The contract and the Plan prompt are untouched. Re-run from Plan on all four sites, then rendered —
no re-clustering, so the component set is the same 50 and this comparison is like-for-like.

Commit: `4d59f8e12d`.

## The mirror guard, per site

The guard that mattered: of the sections whose source centres its text, how many stop declaring
centre. Before the fix all 16 such sections declared centre, so any movement here is the fix trading
one defect for its mirror.

| site      | source-centred | still centre | now left/right | now undeclared |
| --------- | -------------: | -----------: | -------------: | -------------: |
| Park city |              2 |            2 |              0 |              0 |
| Tulane    |              9 |            8 |              0 |              1 |
| Westland  |              5 |            5 |              0 |              0 |
| Freehill  |              2 |            1 |              1 |              0 |
| **total** |         **18** |       **16** |          **1** |          **1** |

**Two sections moved off centre.** Both are near-ties rather than reflexes:

- Freehill _Contact Form with Map View_ — measured `center 22, left 21`. A one-element margin.
- 2424 Tulane _Floor Plan Filter_ — measured `center 15, left 26, right 4`; it declared nothing.

The guard moved, and it moved by two. That is the cost, stated before the benefit.

## The primary numbers, on the identical 45 sections

The diagnosis could measure 45 sections; the acceptance can measure 48, because three components that
had no successful render then have one now. Restricted to the same 45:

| | before | after |
| --- | ---: | ---: |
| source and CSS agree | 17 | **39** |
| disagree | 9 | **6** |
| CSS declares nothing | 19 | **0** |
| **was wrong, now right** | — | **7** |
| **was right, now wrong** | — | **2** |

**Defect, counting every disagreement plus the silently-left: 11 → 6.**

Note that this is a wider definition than the one registered before the run. That one — "centred
against the source, or silently left" — gives 9 → 4 and 2 → 1, but it no longer covers everything:
before the fix every disagreement ran toward centre, and now two run toward left. A definition that
only counts centring would score the fix better by ignoring the two sections it broke.

## Where the remaining defect lives, exactly

| | sections | wrong |
| --- | ---: | ---: |
| declaring **one** alignment | 25 | **0** |
| declaring **two or more** | 23 | **7** |

**Every section with a single measured alignment is correct. Every remaining failure is a section
with more than one.** The seven, with what the prompt showed each:

```
Park city  Site Footer                right  -> left     right 5, center 7, left 2  of 14
Tulane     Footer with address        right  -> center   right 10, center 7, left 4 of 21
Tulane     Site Footer with Contact   right  -> center   right 10, center 7, left 4 of 21
Tulane     Floor Plan Filter          center -> nothing  center 15, left 26, right 4 of 45
Westland   Site Header Navigation     right  -> center   right 8, center 3          of 11
Westland   Hero Intro                 left   -> center   left 3, center 2           of 5
Freehill   Contact Form with Map View center -> left     center 22, left 21         of 43
```

Two mechanisms, and they are different:

**The list contradicts itself in two of the seven.** The lines are ordered by text *area* and labelled
with element *counts*, so Park city's _Site Footer_ leads with `right 5` above `center 7`, and _Floor
Plan Filter_ leads with `center 15` above `left 26`. The order says one thing, the number beside it
says another. Those are the two sections the fix broke and the one it left undeclared.

**The other four are the original reflex, surviving in mixed sections.** Tulane's two footers lead with
`right 10` — first by area *and* by count, unambiguous — and the model still wrote centre. Same for
Westland's header and hero intro. The prompt tells the model what the distribution is and not what to
do with one: "set text-align explicitly to match" is a clear instruction for a single value and silent
for three.

## Regression guards

| guard | before | after |
| --- | --- | --- |
| components planned | 50 | 50 |
| bundled | 49 of 50 | **50 of 50** |
| max font size within 10% | 44 of 45 | **42 of 47** |
| height — tall / short / in band | 3 / 4 / 39 | **6 / 4 / 39** |
| bare hex per component | 0.8 | **1.0** |

Bundling improved and every component now renders. **Three guards moved adversely**: the type ratio
from 98% to 89%, the too-tall band from 3 to 6, and the bare-hex rate from 0.8 to 1.0. Two of the
three have larger denominators than before, because two previously-unrenderable components are now
measurable, but that does not account for the too-tall doubling.

**This is not attributed.** The alignment lines are the only input change, and a prompt that adds
three lines can shift unrelated output; equally, the type-scale work established that these bands move
run to run. The repeat run is what separates variance from effect, and it is the precedent this
project already set when my variance explanation for the too-tall breach was falsified by one.

## The honest summary

The fix removes the whole of the single-alignment defect — 25 of 25 — and clears 7 of the 11 known
failures, at a cost of 2 sections it broke and 2 that moved off centre. It does not solve mixed
sections, which is where all 7 remaining failures sit, and one contributing cause is in the prompt
lines themselves rather than in the model.

---

# Correction: the alignment acceptance above is unverifiable

The measure used throughout the alignment acceptance was wrong, and the artifacts needed to redo it
are gone. This section states what can and cannot be stood behind, because the numbers above will
otherwise be cited as if they had been measured properly.

## What the measure did wrong

It took the dominant `text-align` over a generated component's **whole** stylesheet, counting
`@media (max-width: 768px)` rules alongside the base ones. Park city's _Site Footer_ declares `right`
four times at desktop — contact, legal row, copyright, handicap label — and then centres everything
inside a mobile block. Seven mobile overrides outvoted four desktop rules, so a component whose
desktop alignment matches its source scored `center` against a `right` source.

The sections were captured at 1440px. Only the base rules are comparable. A measure that does not say
which breakpoint it means is measuring all of them.

## How far it reaches, with exposure as the denominator

Only a component that declares `text-align` **inside** a media query can differ; the rest cannot, by
construction. That is the denominator.

| | components | exposed | verdict changes |
| --- | ---: | ---: | ---: |
| Park city, Tulane, Freehill (re-run) | 41 | 8 | **2** |
| 71 Westland (still at v1) | 9 | 1 | 0 |
| **total** | **50** | **9** | **2** |

The two that change are **Park city _Site Footer_** (all-rules `center` → base `right`) and **Freehill
_Property Contact & Office Hours_** (all-rules `center` → base `left`). Both were named in the
acceptance above — one as a section the fix broke, one as a section the fix repaired.

An earlier version of this check reported "0 of 9 changed on Westland" as evidence the defect was not
systemic. **Eight of those nine declare no `text-align` inside a media query at all and could not have
differed.** The evidence was one observation, not nine.

## What cannot be settled, and will not be guessed

The Generate artifacts for Park city, Tulane and Freehill have been overwritten twice — once by the
alignment fix, once by the ordering-key correction. Only 71 Westland still holds a v1 artifact, and
**no site holds a v0 artifact at all.**

- **Park city _Site Footer_** — correct at desktop now. Whether v1 genuinely broke it, or whether the
  measure misread a correct component, cannot be determined. It is one of the two exposed components
  that change verdict, so both readings are live.
- **Freehill _Contact Form with Map View_** — the other section reported as broken by v1. Same
  position.
- **Freehill _Property Contact & Office Hours_** — reported as one of the seven the fix repaired. It
  is exposed and changes verdict, so that repair is equally unsettleable.
- **The whole v0 baseline.** `17 agree / 9 differ / 19 declares nothing` was measured on the flawed
  definition, and the artifacts that would allow it to be re-derived are gone.

**So "defect 11 → 6" cannot be re-established in either direction, and neither can "the fix broke two
sections".** Both are marked unverifiable rather than carried forward. If Park city's _Site Footer_
was never broken, the mirror guard moved by one rather than two — but that is a conditional, not a
finding.

**One v1 claim survives cleanly, for a specific reason.** 2424 Tulane's _Floor Plan Filter_ was
reported as declaring nothing. A mobile-only declaration would have registered as a *value* under the
old measure, not as nothing, so "nothing" cannot be a media-query artefact. It declares no
`text-align` anywhere, base or media, in v2 either.

## A second correction, to my own characterisation

The two sections that moved off centre were described above as "near-ties rather than reflexes", with
Freehill's _Contact Form with Map View_ given as `center 22, left 21` — a one-element margin. **By text
area, which is what ranks the list, it is `center 70%, left 30%`.** That is not a near-tie. The
description was reading element counts, which is the exact confusion the ordering-key fix removed.

## The targeted run: the prediction did not hold

The ordering-key contradiction was real — the list was ranked by text area and labelled with element
counts, so the first line could carry the smaller number — and fixing it was right on its own terms.
**It was not the cause of these failures.**

| section | before fix | v1 | v2 (ordering fixed) | |
| --- | --- | --- | --- | --- |
| Park city _Site Footer_ | right | left | **right** | correct, but v1 unsettleable |
| Tulane _Floor Plan Filter_ | — | nothing | **nothing** | unchanged, prediction fails |
| Freehill _Contact Form with Map View_ | center | left | **nothing** | still wrong, prediction fails |

Two of the three are clean observations and both failed. The commit stands as a correctness fix to the
prompt, not as a validated remedy.

## What the remaining defect actually is

Current state on the three re-run sites, base rules, 39 sections with a measured source alignment:

| | sections | wrong |
| --- | ---: | ---: |
| **one** measured alignment | 21 | **0** |
| **two or more** | 18 | **5** |

```
Tulane    Footer with address, office hours  right  -> center    right 48%, center 38%, left 13%
Tulane    Site Footer with Contact Info      right  -> left      right 48%, center 38%, left 13%
Tulane    Floor Plan Filter                  center -> nothing   center 51%, left 38%, right 11%
Freehill  Contact Form with Map View         center -> nothing   center 70%, left 30%
Freehill  Property Contact & Office Hours    right  -> left      right 48%, center 44%, left 8%
```

**Every section with a single measured alignment is correct, and every failure has two or more.** In
each of the five, the first line is dominant by area — three of them by a clear margin — and the model
either picked a different one or declared nothing.

That is a single identifiable gap, not a mix of causes: **the prompt states the distribution and never
says what to do with a mixed one.** "Set text-align explicitly to match" is unambiguous for one value
and silent for three. That is the next change, and it is deliberately not started in this pass.

## What is not in doubt

The mechanism. The fix passes a real measured alignment to a model that was previously given none,
which is the same mechanism that worked for the type scale and for colour. The five remaining
failures are independently observed on the current artifacts, and the 21-of-21 single-alignment result
is measured on base rules with no inference. None of that depends on the lost baseline.
