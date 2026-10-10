# Regenerating can replace a better component with a worse one, and nothing notices

> **Package:** `@webiny/api-component-extraction` (Generate again / Regenerate; `GenerateComponentTask`
> with `replaceInto`)
> **Severity:** high for the operator's trust in Regenerate. Every regeneration is a draw the operator
> cannot score: it can make a component worse and the screen shows the same green checks.
> **Status:** open, observed 2026-10-09. Not decided: what should be kept or compared.

## What happens

Regenerating a component replaces it with the new answer when the new answer passes its checks. The
answer generated last is the one that stands. Nothing compares it with the answer it replaced, and the
checks cannot tell them apart.

## Where it was seen

The 2424 Tulane Footer on check-job run 3 (`reports/2026-10-09/footer-thinking-quality.md`): four
answers from one identical prompt, every check green on all four. Rendered against the source crop:

| Answer                     | Render height (source 427) | By eye                                                |
| -------------------------- | -------------------------- | ----------------------------------------------------- |
| A, original run            | 442                        | closest to the source                                 |
| B, regeneration 1          | 869                        | worst: unsized logo, lost buttons, rearranged columns |
| C, regeneration 2          | 474                        | wrong-slot text, missing badge and icons              |
| D, regeneration 3 (stands) | 317                        | rearranged, spurious links, doubled copyright         |

The run's original answer (A) was the closest. Three regenerations replaced it, in turn, with the worst
and then two worse-than-A answers, and the run now carries D. At every step the Generate card showed
the same four passing checks.

## What exists already

- **Every attempt's answer is kept** in the generation log (`promptRef` → `output.source`), so an
  earlier, better answer is not lost.
- **The dev-only install path** (`componentExtractionGenerateComponents` with `installEntryId`) can put
  one back. Nothing in the operator's flow offers it.
- **The render records its height against the source's** and the card shows both.

## A free partial signal, and what it is not

The height ratio (render height over source height) is recorded on every render and shown on the card.
Here it is A 1.04, C 1.11, D 0.74, B **2.03**. It would have flagged the worst of the four, B, whose
unsized image doubled the height. It misses C's and D's text errors entirely.

**It is a layout-size signal, not a quality measure.** Worth considering as a check after the 16th, as
a flag on a regeneration that moves the ratio far from 1 or far from the answer it replaces. It should
not be presented as a score.

## Not decided

- Whether Regenerate should keep the previous answer selectable (an undo, or a pick between the last
  few), show the new and old renders side by side before replacing, or both.
- Whether anything should be compared automatically, and if so on what. The height ratio is the only
  free number, and it covers one failure kind.

## Another instance (2026-10-10): ParkCity - Take 3, Property Description

The original Property Description passed every check. It was regenerated for the colour-matcher fix, which
does not touch text, and twice in a row came back failing text preservation, each time after 2 attempts.
The missing paragraphs are "While the units were recently renovated…" and "These apartments will be
available in Downtown…".

**The cause is structural, not chance.**

- Plan recorded the single rich-text `description` prop with four observed values, one per paragraph.
- The check renders with the first, paragraph 1.
- The new components hardcode paragraph 4 and keep paragraphs 2 and 3 only in `description`'s default,
  which a real value replaces.

So on a composed page they would show one paragraph where the site has three. The check is right to fail.
The original answer happened to be built so that all of them rendered; two regenerations were not.

The fixed colour came with lost text, and nothing offered the earlier answer back. Related: the
wrong-slot family, since one field's observed values are really consecutive paragraphs of one instance.
