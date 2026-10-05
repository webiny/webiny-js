# Component Extraction: colour, placement and background divergence — diagnosis

Diagnosis only. Nothing was changed in the capture, the contract or the prompt.

Measured across all four demo sites, 34 components. The question for each concern was which of three
cases holds: (1) the information does not exist in the capture, (2) it exists and never reaches the
prompt, (3) it reaches the prompt and the model does not follow it. Only (3) justifies a prompt
change.

## The answer

| concern               | case                                       | scale                                                                    |
| --------------------- | ------------------------------------------ | ------------------------------------------------------------------------ |
| **Colour**            | **2 — captured, resolved, then discarded** | 14 of 34 components render a background colour the section does not have |
| **Placement**         | **2 — captured, read by nothing**          | 13 of 34 differ in arrangement, 7 of 34 in alignment ⚠️ _see correction_ |
| **Background images** | **1 — not captured at all**                | 4 of 34 sections, far smaller than expected                              |

**None of the three is case 3.** No prompt change is justified by this diagnosis.

> ⚠️ **The placement numbers in this report are withdrawn.** Re-measured with one definition applied
> to both sides, renders carry **more** side-by-side structure than their sources, not less — 19
> gutters invented against 12 lost, 13 components with more and 2 with fewer. The six named column
> collapses are an artefact of a measure that inflated the source side by counting navigation gaps and
> photographic texture as columns. The case attribution below (case 2, captured and read by nothing)
> stands; the direction and the scale do not. See
> `plans/component-extraction-placement-report.md`.

**The three do not correlate.** Both diverge on 7 components, colour only on 7, placement only on 10,
neither on 10 — **phi = 0.00**. Three causes, not one.

---

## W1. The inputs

### The prompt as it stands

Generate receives, in order: the component type and name; "Reproduce the section shown in the
reference image" with the crop attached; the prop list with up to three observed text values each; the
planned token bindings as `target: var(--name)`; the allowed theme variable list; **the measured type
scale** (added since the visual fidelity report); the text to preserve; the observed images and
destinations to use as manifest defaults; and, on a retry, the previous attempt's validation failures.

It contains no colour values, no layout properties and no boxes.

### Colour — captured, resolved, and thrown away

`STYLE_PROPS` records `backgroundColor`, `color` and `borderTopColor` on every node, plus
`borderTopWidth`, `borderRadius` and `boxShadow`.

`sectionShape.collectColors` reads exactly those three colour properties and resolves them against the
theme through `buildTokenLookup`, which maps a slot's resolved hex to its token path. **That
resolution is the answer to "which theme token is this section's colour", and it is computed on every
section of every run.**

It is then discarded. `SectionShape` is not persisted: the stored `Cluster` carries `signature`,
`members`, `representative`, `digest`, `observedTexts` and `representativeCrop`. The shape exists only
long enough to compute a structural signature for clustering similarity.

The consequence is in the Plan prompt. `buildPlanPrompt` receives the structure string, the heading /
image / link counts, the instance count, the observed texts, the theme's slot paths with their
descriptions, and the response schema. **It receives no colours and no image** — and it is the model
asked to output `tokenBindings`.

So the model that chooses which theme colour each prop binds to has never seen the section's colours,
and the model that can see them — Generate, through the reference image — is handed those bindings as
instructions.

### Placement — captured, read by nothing

`STYLE_PROPS` records `textAlign`, `display`, `gap`, `paddingLeft`, `paddingTop`, `marginTop` and
`position`, and every node carries a measured box.

One consumer reads `styles` anywhere in the pipeline: `sectionShape.ts:30`, inside `collectColors`,
reading the three colour properties. **No layout property is read by anything.**

`geometryClass` — `width >= 0.9 * viewportWidth ? "full" : "contained"` plus a column count derived
from the children's vertical bands — is computed in Cluster, and it lives inside `SectionShape`, so it
is discarded with it. The pipeline works out whether a section is full-bleed or contained, and how
many columns it has, and keeps neither.

Neither prompt says anything about arrangement.

### Background images — absent from the capture

`background-image` is not among the 18 properties `STYLE_PROPS` records. Confirmed. Nor are
`background-size`, `background-position` or `background-repeat`.

Capturing one usefully needs the URL and those three positioning properties. Measured on the four
sections that have one, all four are identical: `cover / 50% 50% / no-repeat`. So the URL alone would
reproduce every observed case, and the three properties matter in principle rather than in practice
here.

---

## W2. The divergence

### Colour: the bindings are wrong, nothing is invented

Dominant colours of each render compared with its source crop's, with the theme's own palette as the
third category.

| the render's background colour                  | count  |
| ----------------------------------------------- | ------ |
| matches the section                             | 20     |
| **is a theme colour the section does not have** | **14** |
| is in neither                                   | **0**  |

Across all 204 dominant colours in the 34 renders:

|                                         | count  | share   |
| --------------------------------------- | ------ | ------- |
| also in the source section              | 127    | 62%     |
| **in the theme but not in the section** | **76** | **37%** |
| in neither                              | 1      | 0.4%    |

**One colour in 204 is invented.** The divergence is almost entirely components using real theme
tokens that are not the section's colours — which is what a binding proposed without sight of the
section produces. This is the distinction the brief asked for, and it falls decisively on the
"wrong token" side rather than the "colours nobody specified" side.

### Placement: arrangement, not spacing

Measured on both images the same way: interior vertical gutters give a column count, and the
horizontal centroid of the ink within its span gives an alignment band. Spacing is excluded; it has
its own pass.

| arrangement                  | count |
| ---------------------------- | ----- |
| same column count            | 21    |
| **render has fewer columns** | **7** |
| render has more columns      | 6     |

Six of the seven collapse a multi-column section into a single column: Property Description 3→1, Site
Header Navigation 5→1, Hero Introduction Section 3→1, Freehill Hero Banner 4→1, Contact Form with Map
View 2→1, Privacy Policy 2→1.

> ⚠️ **Withdrawn.** Five of these six do not survive a symmetric measure: they are photographic
> sections, where ink cannot measure layout, or sections whose arrangement the render in fact keeps.
> The sixth, _Site Header Navigation_, is real and is the opposite defect — the render has more
> structure than the source, not less.

| alignment band (left / centre / right) | count |
| -------------------------------------- | ----- |
| same                                   | 27    |
| different                              | 7     |

The column measure counts any full-height gap, so a navigation bar's inter-item gaps register as
columns and small differences there are not meaningful. The collapses to a single column are the
signal; the `5->7` and `2->4` rows are the measure's noise floor.

The source side's `textAlign` is captured — `start`, `center`, `left`, `right` all appear in the
trees — so the alignment information exists exactly where the report says it does and reaches nothing.

### Background images: four, and not where expected

Asked of the live pages at the capture's width, locating each section by best overlap with the box the
capture recorded.

|                                                   | count |
| ------------------------------------------------- | ----- |
| CSS background image covering >25% of the section | **4** |
| gradient background only                          | 1     |
| neither                                           | 28    |
| section could not be located on the live page     | 1     |

**0 of the 7 hero/banner components use a CSS background image.** The heroes use `<img>` elements,
which `image-values-are-captured-and-never-derived` already covers and which now carry real values.

The four: Park city Palace _Property Description_, 2424 Tulane _Location Description_,
_Neighborhood/Location Highlight_ and _FAQ Section_.

The brief's hypothesis — that this is most hero sections and therefore the largest of the three — is
not supported. It is the smallest.

---

## W3. Attribution, and whether one cause explains three

**Colour — case 2.** The colour is captured, is resolved to a theme token, and the resolution is
discarded before anything can use it. The binding is then proposed blind. A stricter instruction
cannot help: the model is already following the binding it was given, which is what the 0-of-204
invented figure shows.

**Placement — case 2.** `textAlign`, `display`, `gap` and the boxes are captured and read by nothing,
and the computed `geometryClass` is discarded with the shape. Nothing about arrangement reaches either
prompt.

**Background images — case 1.** Not captured. Four sections, all `cover / 50% 50% / no-repeat`.

**They do not correlate.** Both diverge on 7, colour only on 7, placement only on 10, neither on 10;
phi = 0.00. The same components are not failing all three, so this is three independent gaps rather
than one cause with three symptoms — which also means fixing one will not move the others.

### What this is the fourth instance of

Colour and placement are both the shape this project keeps finding: measured during capture, carried
one stage, dropped before the stage that needs it. Images, type sizes, link values, measurements
generally — and now colour resolution and layout. In the colour case the pipeline goes further than
before: it does the work of resolving the section's colours to theme tokens, and then throws the
answer away.

---

## Where the bindings actually point

Looking at what Plan proposes, with Park city Palace as the example: **73 token bindings, of which 15
name a background or surface at all.**

```
Site Navigation Header   header.background      -> color.surface.raised
                         navLinks.color         -> color.text.primary
Hero Banner              eyebrowText            -> color.text.secondary
                         cta                    -> color.action.primary.background
                         (no background binding)
Property Description     heading                -> type.heading.2
                         body                   -> color.text.primary
                         (no background binding)
```

They are semantically plausible and chosen without sight of the section. The section's **background**
— the most visually dominant colour it has, and the one this divergence is measured on — is usually
not bound at all, so Generate picks a surface token from the allowed list on its own.

And more bindings do not rescue it:

| token bindings on the contract | components | background diverges |
| ------------------------------ | ---------: | ------------------: |
| 1–5                            |          5 |             3 (60%) |
| 6–10                           |         15 |             6 (40%) |
| 11+                            |         14 |             5 (36%) |

Divergence falls only from 60% to 36% as bindings go from a handful to a dozen. Having bindings is not
the problem; having the right ones is, and having none for the background is most of it.

## The hypothesis that was wrong

The brief expected background images to be most hero sections and therefore the largest of the three
concerns. **Measured, it is 4 of 34 sections and 0 of 7 heroes, and it is the smallest.** The heroes
use `<img>` elements, not CSS backgrounds, so they were already covered by the image derivation. Said
plainly because the expectation was reasonable and the measurement contradicted it.

## Order by value

They do not correlate, so they can be taken in any order, and this is the order worth taking:

1. **Colour.** The largest, and the fix persists something the pipeline already computes rather than
   capturing anything new.
2. **Placement.** Captured and read by nothing — that part holds. ⚠️ Neither the six collapses nor
   the raw 13 survived re-measurement; see the correction at the top. Alignment is the measurable
   half and is being fixed first.
3. **Background images.** The smallest. The URL alone covers every observed case, since all four are
   `cover / 50% 50% / no-repeat`.

## Method caveats

Both are kept because each would have produced a confident wrong number.

**The live-site probe matched sections by exact box first, and located 21 of 34.** Nearly all of 2424
Tulane failed. The pages were captured days earlier and the live DOM has drifted, so a 4px tolerance
was measuring layout drift while appearing to measure section backgrounds — and would have reported
"2 of 34 sections have a background image" with a third of the sample silently missing. Matching by
best overlap instead, with the capture's own overlay clearance mirrored, located 33 of 34. The one
that still fails is 2424 Tulane's _Site Header Navigation_ at 27% overlap, reported rather than
counted.

**The column measure counts any full-height gap**, so a navigation bar's inter-item gaps register as
columns. `5->7` and `2->4` are its noise floor, not findings.

> ⚠️ This caveat did not go far enough, and the number it protected was wrong anyway. The measure had
> a second flaw pointing the same way — nothing required a gutter to hold across the rows it separated,
> so photographic texture counted as columns too — and both flaws inflate the **source** side, which
> is what manufactured the collapses. Neither the six nor the raw 13 should be read as divergences.
> `plans/component-extraction-placement-report.md` has the measure that replaces it, and the five
> definitions falsified on the way to it.

## The pattern, at its starkest

Colour is the fifth instance of measured-then-dropped in this project, and the most pointed. The
others lost a value that was captured. This one loses a value that was captured **and then computed
with**: `collectColors` resolves the section's colours against the theme to produce exactly the
mapping Plan needs, uses it to build a clustering signature, and discards it.

So the model that picks the tokens cannot see the colours, and the model that can see them receives
those picks as instructions. 37% wrong token against 1 invented is what obeying the wrong instruction
looks like.

---

# Acceptance: the colour fix

Built as proposed. Cluster resolves each section's colours to the theme token expressing them and
persists them on the member; Plan carries them into the contract in slot paths; Generate names each
one with its `var()`. Re-run from Cluster through Generate on all four sites, then rendered.

Commits: `7c21719376` (carry the colours), `1e154d49fd` (match a colour to a token of its own family).

## The denominator changed, so component counts are not like-for-like

Publishing the four themes — done for the type-scale acceptance, before this fix — turned on the
token term in clustering. While the manifest failed to resolve, every section's token set was empty,
and `setJaccard([], [])` returns 1, so that term contributed the same constant to every pair and did
nothing. With the themes published it discriminates, and the clusters split:

| site      | before | after |
| --------- | -----: | ----: |
| Park city |      7 |    10 |
| Tulane    |     13 |    22 |
| Westland  |      8 |     9 |
| Freehill  |      6 |     7 |
| **total** | **34** | **48** |

This is not caused by the colour change. **Aggregate shares remain comparable; per-component
before/after does not.**

## Background colour

| site          | matches the section | a theme colour it does not have | in neither |
| ------------- | ------------------: | ------------------------------: | ---------: |
| Park city     |                   8 |                               2 |          0 |
| Tulane        |                  16 |                               6 |          0 |
| Westland      |                   8 |                               0 |          0 |
| Freehill      |                   4 |                               3 |          0 |
| **total**     |              **36** |                          **11** |      **0** |
| _before_      |                _20_ |                            _14_ |        _0_ |

**59% → 77% match. Theme-not-section 41% → 23%.** Nothing lands in neither, before or after.

_Counts are over 47 rendered components after and 34 before; see the denominator note above. The
shares compare, the counts do not._

Across every dominant colour in every render:

|                                     | before       | after        |
| ----------------------------------- | ------------ | ------------ |
| also in the source section          | 62%          | **84%**      |
| in the theme but not in the section | 37%          | **14%**      |
| in neither                          | 0.4% (1/204) | 2.2% (6/272) |

## The invented-colour guard, per site

This is the guard that mattered most, and it needed measuring twice.

**The first measure was wrong.** Counting every `#hex` in the generated code gave 300 hexes against
0 `var()` uses, which reads as the fix having traded tokens for hardcoded colours. The model actually
writes `background: var(--wby-color-surface-page, #ffffff)` — a variable with a fallback. The regex
required `)` straight after the variable name, so it matched none of them and counted every fallback
as a hardcoded colour. A hex inside a `var()` survives a theme change; only a **bare** hex does not.

| site          | components | colour `var()` | hex as a fallback | **bare hex** | bare per component |
| ------------- | ---------: | -------------: | ----------------: | -----------: | -----------------: |
| Park city     |         10 |            112 |               111 |            4 |                0.4 |
| Tulane        |         22 |            163 |               162 |           23 |                1.0 |
| Westland      |          9 |             95 |                95 |            2 |                0.2 |
| Freehill      |          7 |             72 |                70 |            9 |                1.3 |
| **total**     |     **48** |        **442** |           **438** |       **38** |            **0.8** |

_48 components, not 34; see the denominator note above. Per-component rates compare, totals do not._

**The pre-colour baseline for the same measure is 0.8 bare hexes per component** — Freehill's Generate
artifact, captured while the re-run was still on Westland and confirmed pre-colour by the absence of
`resolvedColours`: 6 components, 72 colour `var()`, 65 fallbacks, 5 bare. The rate is unchanged.

What each bare hex is, measured against what the prompt told the model:

| site          | against a variable it was given | sanctioned — no token, use the hex | unlisted |
| ------------- | ------------------------------: | ---------------------------------: | -------: |
| Park city     |                               3 |                                  0 |        1 |
| Tulane        |                               1 |                                 19 |        3 |
| Westland      |                               2 |                                  0 |        0 |
| Freehill      |                               2 |                                  7 |        0 |
| **total**     |                           **8** |                             **26** |    **4** |

**8 of 48 components wrote a hex where a variable was given.** All eight are `#ffffff`, `#000000` or
`#333333` — the colours a model reaches for without thinking. The other 30 are the prompt working as
instructed or the model's own choice on a colour the section never measured.

Freehill's rate rose, 0.8 → 1.3 per component, and **7 of its 9 bare hexes are sanctioned**: its
theme has no token near `#000000`. The rise is the null-token branch, not disobedience.

## The gap this exposes: themes that cannot express their own site

| site      | measured colours with no theme token near them |
| --------- | ---------------------------------------------: |
| Park city |                                    0 of 42 (0%) |
| Tulane    |                                 17 of 100 (17%) |
| Westland  |                                   2 of 39 (5%)  |
| Freehill  |                                  7 of 25 (28%)  |

Tulane's greens and pinks — `#366748`, `#e0e299`, `#e08b81` — and Freehill's near-black are colours
their sites use and their extracted themes do not carry. This is the same family of finding as the
type scale stopping short of a site's display headings, and it belongs to theme extraction. The
colour fix did not create it; it made it countable.

## Regression guards

| guard                         | before     | after      |
| ----------------------------- | ---------- | ---------- |
| max font size within 10%      | 31 of 32   | **44 of 45** |
| height — too tall             | 5          | **3**      |
| height — too short            | 6          | **4**      |
| height — in band              | 23         | **39**     |

Both hold. The too-tall breach that the type-scale repeat showed to be reproducible rather than
variance is 3 of 46 here; it is still unattributed and still belongs to the spacing pass.

**47 of 48 components bundled.** Westland's _Welcome Hero Banner_ failed after three attempts with
"Source must have a default export function". That is a malformed generation, not a colour failure,
and it cannot be attributed to this change because Westland's cluster set also changed (8 → 9).

## What the six "invented" pixel colours actually are

Checked one by one, because the share moved off near-zero and a share is not a cause:

- **Four** are Tulane _Specials Section_: `#e8e898`, `#d8e898`, `#e8e8a8`, `#c8c888` — all quantised
  shades of `#e0e299`, which is the section's own measured background and has **no theme token**. The
  prompt told the model to use the hex, and it did. Not invented.
- **One** is Park city _Hero Banner_ at 4% of the render: photograph content, in a section whose crop
  and render are both dominated by a building photo.
- **One** is genuinely the model's own: Tulane _Neighborhood/Location Highlight_ writes
  `background: #e3e39a`, a yellow-green the section does not measure anywhere.

So one colour in 272 is a colour nobody specified, against one in 204 before.

## A caveat the pixel measure needs

Tulane _Specials Section_ reads as "a theme colour the section does not have" at a distance of 268,
and the reason is not colour. Its crop is the full 1440×900 homepage hero — a building photograph —
while Classify scoped the component to the yellow SPECIALS tab inside it. The render is that tab,
correctly, in the section's own `#e0e299`. The hero's own background is an `<img>`, so it has no
`backgroundColor` to measure and `resolveSectionColours` reports the tab's colour as the section's
only painted background, which is literally true.

**Where a component is scoped narrower than the section its crop shows, the background verdict
measures the scoping, not the colour.** Both the "theme, not section" count and the invented count
carry some of this.
