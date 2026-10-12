# Item 4, data first: the alt gaps and the heading levels, replayed

These are the three data changes that come before any accessibility or performance instruction. No
instruction has been written. **Committed, not deployed:** a deployed Generate or Regenerate would
already send the new lines, and the generation run is held.

## What changed in the prompt

1. **Alt on images inside list and object items.** Each item's image now carries its alt:
   `items[]: { image: … (alt: "Brick building with rounded corners at …"), link: … }`. Before, it was the
   URL only (`componentGeneration.ts`, the structured-value lines).
2. **Alt in the lines that size the section's pictures.** `SectionImageFact.alt` was recorded and not
   printed.
3. **The source's heading levels.** Computed where the prompt is built, from the representative
   section's tree, the same way spacing and background regions are, so every stored plan gets them
   without a Plan re-run (`sectionHeadings.ts`). Data only:

   ```
   The section's headings, as the source page marks them up, in page order:
   - h1 "Park City Place", with "A Refreshing Community:" inside it
   ```

   Text in a child element (an eyebrow `<span>`) is named apart, because the tree does not record which
   comes first. A section with no heading element gets no lines.

## The replay

- **Scope:** every component of the 31 runs with Plan done, 385 components in all. Each prompt was
  rebuilt from the stored plan, segment, tree and theme, all refreshed on 2026-10-12.
- **Method:** "before" is the committed code; "after" is with the three changes. The predictions were
  written first.

| Prediction                                                                  | Result                                                                                        |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| A1. Remove the three additions and every prompt is byte-identical to before | **held, 385 of 385**                                                                          |
| A2. No component loses an alt                                               | **held:** 34 gain, 0 lose                                                                     |
| A3. Section alts in the prompt: 60–75% before, 90%+ after                   | **wrong:** 43% before, 71% after (173 → 286 of 404). The split by plan age explains it, below |
| H1. Half or more of components have a source heading                        | held: 239 of 385 (62%), 462 headings (79 h1, 293 h2, 86 h3, 4 h4)                             |
| H2. Under 15% of multi-member components disagree on levels                 | 27% differ in some way; **11% (19 of 180) are real level conflicts**, below                   |
| H3. About 30% of components with a type scale have no source heading        | 36% (103 of 289)                                                                              |

### Alt text, by plan age

The 118 alts still missing after the fix are all in plans made before Plan recorded the images no prop
took (`unboundImages`). None are lost to the size floor, a fixed position or a dropped binding.

| Plans                                  | Alts | Before    | After          |
| -------------------------------------- | ---- | --------- | -------------- |
| Made since Plan records unbound images | 158  | 123 (78%) | **158 (100%)** |
| Older                                  | 246  | 50 (20%)  | 128 (52%)      |

The demo runs are all in the first group:

| Run                   | Before   | After        |
| --------------------- | -------- | ------------ |
| 71 Westland rehearsal | 16 of 20 | **20 of 20** |
| Take 3                | 13 of 16 | **16 of 16** |
| Site-tenant rehearsal | 3 of 7   | **7 of 7**   |

The older runs (September, and the 2026-10-06 baselines) would need Plan re-run to reach 100%, and a
Plan re-run is not variance-free.

### Heading levels across a component's copies

Of 180 components with two or more copies:

| What the copies' headings do                          | Components   |
| ----------------------------------------------------- | ------------ |
| All copies agree                                      | 132 (73%)    |
| Same top level, a different number of headings        | 15           |
| Some copies have no heading                           | 14           |
| **Top level differs** (h1 on one page, h2 on another) | **19 (11%)** |

- **Typical case:** a hero or intro that is the h1 on the home page and an h2 elsewhere. 2424 Tulane's
  "Hero Intro Section" is `[h1] [h2] [h2]`.
- **In the demo runs:** one, Take 3's "Property Highlights Links" (h2 ×3 on one page, h1 on another).
- **Why it matters:** the prompt describes one copy, its representative. **A component with one
  heading level written into its code is wrong on some pages for these 19.** That decides what the
  heading instruction can say. It can say "use the level shown", which is wrong for 11% of multi-copy
  components. Or the level can be an input, set per page from that page's source at composition.

### A line already in the prompt that the new data contradicts

The prompt has always ended its type scale with "The largest is the section's heading at N px." For
**103 of the 289 components with a type scale (36%)**, the source marks up no heading in that section:
footers, navigation, cards, contact bars. The line names a heading that does not exist. It is
instruction territory, so it is left as it is until the instructions are agreed. It should be removed or
made conditional, now that the real levels are carried.

## Tests

- `sectionHeadings.test.ts`: 4 tests on real sections cut from Take 3's and 71 Westland's home pages.
- `componentGeneration.altAndHeadings.test.ts`: 5 tests on 71 Westland's stored Property Listings Gallery
  and the same sections. 4 of them fail with the three changes reverted; the fifth (no lines for a
  section without headings) passes either way by construction.
- The extraction package: 525 of 525.
