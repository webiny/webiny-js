# Sections whose background is not one thing: measured, built, tried

The case: a translucent pattern over a light backdrop, with a solid navy panel in front of part of it. The
prompt gave both as section-wide facts, so the model put both on one element and the pattern tiled across
the navy. The colour work fixed which colour is chosen. It cannot say "this colour covers this region and
that image covers that one", because area share cannot express a region.

Built in `generate/backgroundRegions.ts` (commit 3c689d6c69) and deployed. On the four Take 3 components it
was tried on, it fixed the navy in one and showed two new defects; see "Tried".

## The measure

**The "3 of 30" this work started from exists in no record.** It is not in the repo's reports, plans or
issues, in memory, or in the session transcripts; it came from a summary. The nearest recorded figure,
"4 of 34 sections with a CSS background image covering more than 25%"
(`plans/component-extraction-colour-placement-background-report.md`), measures something else. The counts
below come from the definition here and are not a re-run of either.

Over each cluster representative's section box, a 20×20 grid. At each point, the top-most CSS background
paint: a `background-color`, or a CSS `background-image`. Content `<img>` elements are photographs, not
background. Rules:

- **Where the section paints nothing**, its nearest painting ancestor shows through (the backdrop).
- **Same paint:** two colours closer than 6 in RGB. Anything under 0.9 opacity is not a region colour.
  The re-measure counted with "within 8 per channel"; the build uses the distance below 6 (see "Two-tone
  sections"). The build's replay agrees with the re-measure on 418 of 420 sections it could compare.
- **Non-uniform:** two or more paints each cover at least 15% of the section.
- **W2:** non-uniform, and one region is a background image while another is a solid colour.
- **G5:** the page loads assets from G5's Cloudinary (`g5-assets`).

### Every count here is a lower bound

A region drawn by a pseudo-element is not in the capture
(`ai-context/issues/capture-records-no-pseudo-elements-or-opacity.md`). Take 3's Apartment Intro Hero has a
slate panel on its source and measures as 100% pattern. The tried components show the blind spot also
**shrinks regions it does find**: Property Description's source shows navy from about x 24% to the right
edge, full height, but the only navy element in the capture is x 51–97%, y 9–88%.

### Exposure: the 13 runs before 2 October cannot show W2

No capture before 2 October records background images (the `background` field), so a pattern region
cannot be seen in those runs. Their W2 count of 0 is over an ineligible population, not evidence. Every
site's latest run is from 6 October or later and records them.

## Result (lower bounds)

**Latest run per site** (one run each, all capturing backgrounds):

| Site               | Template | Sections | Non-uniform (lower bound) | W2 (lower bound) |
| ------------------ | -------- | -------- | ------------------------- | ---------------- |
| Park City (Take 3) | G5       | 16       | 5                         | **4**            |
| The Vibe           | not G5   | 33       | 10                        | **5**            |
| 2424 Tulane        | G5       | 21       | 3                         | 1                |
| Freehill           | G5       | 8        | 2                         | 1                |
| 71 Westland        | G5       | 16       | 3                         | 0                |
| webiny.com         | not G5   | 25       | 5                         | 0                |
| **Total**          |          | **119**  | **28 (24%)**              | **11 (9%)**      |

**All 33 runs** (453 sections, 451 resolved): at least 92 non-uniform and at least 26 W2. Of those, 307
sections are G5, with at least 58 non-uniform and 21 W2. That total includes the 13 runs that cannot show W2.

- **At least a quarter of sections have a non-uniform background** (28 of 119, lower bound); at least a
  tenth are W2 (11 of 119, lower bound).
- **G5 alone does not predict W2.** G5 sites carry 6 of 61 sections; The Vibe, which is not G5, carries 5
  of 33 (both lower bounds).
- **Park City is the concentration: 4 of 16 components (lower bound), all on one shared pattern**
  (`Denver_Background_Tertiary_bnx4vk.png`).

### Take 3, component by component

| Component                       | Regions as captured                                     | Case            |
| ------------------------------- | ------------------------------------------------------- | --------------- |
| Property Description            | pattern 64%, navy 36% (source's navy is wider)          | **W2**          |
| Neighborhood Overview           | pattern 78%, navy 23% (source's navy is wider)          | **W2**          |
| Neighborhood Perks Section      | pattern 51%, white 49%                                  | **W2**          |
| Application/Contact Form        | pattern 59%, white 40%                                  | **W2**          |
| Neighborhood/Location Highlight | light grey `#f7f7f9`, white `#ffffff`                   | two-tone colour |
| Apartment Intro Hero            | pattern 100%; a slate panel on the source is uncaptured | blind spot      |

## Decisions

- **Two-tone colour sections are included**, with the floor set from the observed distribution.
- **15% region threshold**, with a code comment saying what it was set from and that it is not a
  perceptual rule.
- **Replace, not add.** For a section with regions, Plan's whole-section background binding, the colour
  list's background lines for the region colours and the section-wide image lines are removed. They would
  contradict the regions, and a wrong region should fail visibly, not be overridden.

### Two-tone sections: the floor

**The near-white pairs are design, not capture artefacts.** Each was checked against its screenshot:
Take 3's white card on the page's light grey (`#ffffff` on `#f7f7f9`), and webiny.com's grey card on
white. Both cards are visible on the source. Pairs closer than 6 are the same colour recorded twice: Take
3's header grey, captured once opaque and once at 0.95 opacity. Between them the observed distribution has a
clear gap. So the floor is 6, as a "same paint" rule, not a contrast threshold. A higher contrast floor
would have dropped real cards.

The proposal's example pair, "`#f0f0f8` against `#f8f8f8`", was wrong. The captured pair is `#f7f7f9`
against `#ffffff`.

## Built

- **Computed at Generate** from the representative's captured tree (`sectionBackgroundRegions`), so it
  reaches every stored plan, the older ones included. A region colour's token comes from the current
  matcher, and so does the colour under an image (not Plan's stored token).
- **Prompt:** "This section's background has N regions, listed bottom first. Paint each on the element that
  covers its area, and do not put two of them on one element:", then one line per region with its paint
  and its box in section percentages.
- **Tests (7)** on real captured sections: Property Description (pattern plus navy), Location Highlight
  (two-tone), the header (a duplicate merged to one paint, so no regions), the footer (uniform), oklch
  parsing, the prompt replacing the section-wide lines, and a uniform prompt left byte-identical.

## Replay over all 33 stored plans

| Set                           | Predicted                            | Result                 |
| ----------------------------- | ------------------------------------ | ---------------------- |
| Prompts that change           | exactly the multi-region sections    | 87 of 421 components   |
| Prompts unchanged             | every uniform section, byte for byte | 334, byte-identical    |
| Pre-2-October captures        | colour regions only                  | no image region in any |
| Agreement with the re-measure | the same sections                    | 418 of 420             |

- **What the 87 lose:**
  - 41 background bindings;
  - 89 colour-list background lines;
  - 57 section-wide image lines;
  - 1 binding named "section background".

  Each is replaced by region lines, and nothing else in any prompt moves.

- **The 2 disagreements are one pre-existing defect, not this build.** In The Vibe's 22 September run, the
  cluster representative's box differs from the segment section at that `sectionIndex`. So
  `loadRepresentativeNode` reads the wrong section for 6 components in that run. Recorded, not fixed.

## Tried: targeted Generate of Take 3's four W2 components

The four were regenerated on the deployed build and rendered. Predictions were written before the run.

- **Checks:** all four pass every generation check. Property Description now also passes text
  preservation. That was **not predicted** (it was expected to keep failing on the structural wrong-slot
  cause) and is variance, not a fix.
- **Property Description, as predicted:** the navy panel is solid. Before, the pattern's lines ran across
  it and through the text. Where the pattern sits cannot be seen: the photo covers the left in both
  renders.
- **Not predicted: three of four fade the pattern.** Property Description and Contact Form lay an 88% grey
  wash over it (`linear-gradient(rgba(247,247,249,0.88)…)`), and Perks sets `opacity: 0.12` on it. In two
  of the renders the pattern is gone. **Made by this build.** The image's pixels are already about 12%
  opaque. The old sentence stated that number and then "the colour shows through it and is what the section
  looks like there"; the region line keeps the number and drops that explanation, so the model applies the
  number as an instruction. No earlier generated component used a wash.
- **Not predicted: Neighborhood Overview draws the navy as a literal box** at the stated coordinates (left
  50%, top 25%, width 45%, height 50%). Its text column is wider than the box and runs out of it in white on
  the light pattern, so the ends of lines cannot be read. The captured navy box is smaller than the
  source's panel (the blind spot above). The line's coordinates were meant to identify the element, but
  they read as a drawing instruction. **Made by this build**, from a capture limit it exposes.
- **My prediction would not have caught the first defect.** "The pattern region shows the light backdrop"
  is also true of a washed-out pattern.
- **The region-centre pixel check was invalid** and is not reported as a result: the sample points fell on
  text and photographs. The comparison above is by eye, against the crops.

These four regenerated components are now the run's current Generate output. Take 3's built site uses the
components promoted before this, so nothing deployed shows them. Promoting them from this run would ship
the defects.

## Not done

- No fix for the two defects. The likely ones:
  - the wording: the image is see-through in itself, so draw it at full strength;
  - stating the boxes as "which element", not as coordinates to draw.

  Both await a decision.
