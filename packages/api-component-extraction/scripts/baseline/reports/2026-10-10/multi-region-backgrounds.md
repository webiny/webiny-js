# Sections whose background is not one thing: re-measured, and a proposal

Diagnosis and proposal only; nothing built. The case: a translucent pattern over a light backdrop, with a
solid navy panel in front of part of it. The prompt gives both as section-wide facts, so the model puts
both on one element and the pattern tiles across the navy. The colour work fixed which colour is chosen;
it cannot say "this colour covers this region and that image covers that one". Area share cannot express a
region.

## The original "3 of 30" could not be found

It is not in the repo's reports, plans or issues, in memory, or in the session transcripts. The nearest
recorded figure is the colour/placement/background diagnosis's "4 of 34 sections with a CSS background
image covering more than 25%" (`plans/component-extraction-colour-placement-background-report.md`). So
this is a fresh measure with its definition stated, not a re-run of an old one.

## The measure

Over each cluster representative's section box, a 20×20 grid. At each point, the top-most CSS background
paint: a `background-color`, or a CSS `background-image`. Content `<img>` elements are photographs, not
background. Rules:

- **Where the section paints nothing**, its nearest painting ancestor shows through (the backdrop).
- **Colours within 8 per channel are one paint**, and anything under 0.9 opacity is "translucent".
- **Non-uniform:** two or more paints each cover at least 15% of the section.
- **W2:** non-uniform, and one region is a background image while another is a solid colour.
- **G5:** the page loads assets from G5's Cloudinary (`g5-assets`).

Checked on known cases before counting: Take 3's Property Description reads pattern 64%, navy 36%, so it
is W2. The header reads one grey. The measure was refined twice first:

- unpainted area was "none" until it was resolved to the backdrop;
- `#f7f7f9` and the same colour at 0.95 opacity read as two paints until near-equal colours merged.

### Exposure: the 13 runs before 2 October cannot show this case

No capture before 2 October records background images (the `background` field), so a pattern region
cannot be seen in those runs. Their W2 count of 0 is over an ineligible population and is not counted as
evidence. Every site's latest run is from 6 October or later and records them.

### A blind spot that undercounts

A region drawn by a pseudo-element is not in the capture
(`ai-context/issues/capture-records-no-pseudo-elements-or-opacity.md`). Take 3's Apartment Intro Hero has a
slate panel on its source and measures as 100% pattern. Every count below is a lower bound wherever regions
are drawn that way.

## Result

**Latest run per site** (one run each, all capturing backgrounds):

| Site               | Template | Sections | Non-uniform  | W2 (image + colour) |
| ------------------ | -------- | -------- | ------------ | ------------------- |
| Park City (Take 3) | G5       | 16       | 5            | **4**               |
| The Vibe           | not G5   | 33       | 10           | **5**               |
| 2424 Tulane        | G5       | 21       | 3            | 1                   |
| Freehill           | G5       | 8        | 2            | 1                   |
| 71 Westland        | G5       | 16       | 3            | 0                   |
| webiny.com         | not G5   | 25       | 5            | 0                   |
| **Total**          |          | **119**  | **28 (24%)** | **11 (9%)**         |

**All 33 runs** (453 sections, 451 resolved): 92 non-uniform, 26 W2. Of those, 307 sections are G5, with
58 non-uniform and 21 W2. That total includes the 13 runs that cannot show W2.

### Higher than 3 in 30, and concentrated by site, not by template

- **Non-uniform backgrounds are about a quarter of all sections** (28 of 119). W2 is about a tenth (11 of
  119).
- **G5 alone does not predict W2.** G5 sites carry 6 of 61 sections; The Vibe, which is not G5, carries 5
  of 33.
- **Park City is the concentration: 4 of 16 components, all on one shared pattern**
  (`Denver_Background_Tertiary_bnx4vk.png`). So every Park City run hits several components at once, as the
  screenshots suggest.

### Take 3, component by component

| Component                       | Regions                                                             | Case            |
| ------------------------------- | ------------------------------------------------------------------- | --------------- |
| Property Description            | pattern 64%, navy 36%                                               | **W2**          |
| Neighborhood Overview           | pattern 78%, navy 23%                                               | **W2**          |
| Neighborhood Perks Section      | pattern 51%, white 49%                                              | **W2**          |
| Application/Contact Form        | pattern 59%, white 40%                                              | **W2**          |
| Neighborhood/Location Highlight | grey 76%, white 23%                                                 | two-tone colour |
| Apartment Intro Hero            | pattern 100% as measured; a slate panel on the source is uncaptured | blind spot      |

## What Generate is told today (Property Description)

- **Plan's binding:** `section.background: var(--wby-color-surface-sunken)`, the navy.
- **The measured colours:** "background #363f54 — use var(--wby-color-surface-sunken)".
- **The see-through image:** "This section's background has a mostly see-through image drawn over a
  colour… Under it, paint var(--wby-color-surface-raised) (#f7f7f9), and set the image over it as a CSS
  background-image".
- **Geometry:** "background Denver_Background_Tertiary_bnx4vk.png at 0,0 — 1440x640", the whole section.

Two section-wide statements, and nothing says the navy covers only the text column. The model reconciles
them on one element.

## Proposal

**Describe a section's background as regions, each with its paint and where it is.**

1. **Regions from the capture.** The painting layers the measure already finds, each with its box in
   section coordinates (as percentages), its paint (a colour, with its token from the matcher, or an
   image), and stacking order. Small paints (under 15%: buttons, badges) stay in the colour list as now.
2. **Computed where the prompt is built, from the representative's captured tree.** Then it reaches every
   stored plan, the older ones included, the lesson from #2 and from the under-image route. Captures from
   before 2 October get colour regions only: they hold no images.
3. **The prompt says it as regions** for a non-uniform section, e.g.:

   > This section's background has two regions. The whole section: a see-through pattern over
   > var(--wby-color-surface-raised). On top of it, the right 46% (the text column): a solid
   > var(--wby-color-surface-sunken) panel. Put the pattern on the section and the panel colour on the
   > column; do not put both on one element.

   A uniform section's prompt is unchanged, byte for byte.

4. **No conflicting section-wide line.** For a non-uniform section, Plan's single `section.background`
   binding and the colour list's background lines would contradict the regions, so they are replaced by
   the region lines, not added to.
5. **A check, after generation:** the rendered component's colour sampled at each region's centre against
   the crop's. It needs the region boxes, and is the measure of whether the prompt worked.

### Named sets, before any run

- **Should change** (the prompt gains region lines): the non-uniform sections. In the latest runs, 28; the
  11 W2 ones are the ones that matter most. Across all 33 runs, 92.
- **Should not change:** every uniform section's prompt, byte for byte (91 of the 119 latest-run
  sections; 359 across all runs).
- **Replay offline over all 33 stored plans** (the 13 pre-background captures included), diffing prompts:
  - the sections that change must be exactly the non-uniform set, and no uniform section may change;
  - pre-2-October captures may gain colour regions only.
- **Then a targeted Generate of Take 3's 4 W2 components** (about $1), with renders compared to the crops
  at each region's centre.

### Decisions for you before building

- **Two-tone colour sections (17 of the 28 latest).** Include them, or only W2? They have the same
  section-wide flaw, but some are low-contrast (Take 3's location highlight: `#f0f0f8` against `#f8f8f8`).
  A contrast floor between region colours (for example, distance over 12) would keep near-white pairs out.
- **The 15% region threshold** is a judgment, like the fit's 6: set from these sections, not derived.
- **Replace Plan's `section.background`** for multi-region sections (proposed), or keep it and add regions?
