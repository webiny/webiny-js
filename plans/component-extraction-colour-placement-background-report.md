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
| **Placement**         | **2 — captured, read by nothing**          | 13 of 34 differ in arrangement, 7 of 34 in alignment                     |
| **Background images** | **1 — not captured at all**                | 4 of 34 sections, far smaller than expected                              |

**None of the three is case 3.** No prompt change is justified by this diagnosis.

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
