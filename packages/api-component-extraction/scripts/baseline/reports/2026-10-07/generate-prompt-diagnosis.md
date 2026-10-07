# Generate prompt diagnosis, 2026-10-07

Diagnosis only; the prompt was not rewritten. Prompts read: Park City Place "Property Description",
2424 Tulane "Property Description with Scores", thevibe "Hero Intro", 71 Westland "Property Footer",
rebuilt with the current code from each run's plan, plus the full system prompt as logged on a live call.
Compliance measured over 101 generated components (the baseline and three check runs).

## Headline

**The model follows the prompt closely, and the prompt is accurate about wrong data.**

Compliance is high wherever the prompt gives a measured instruction: the type-scale variable is used
71 of 71 times and the px value 18 of 19, measured colours' variables appear 302 of 307 times, and text
is centred against the source 2 of 90 times. That is not an under-instructed model. The premise this
diagnosis started from — that the prompt was too long and the model was skimming it — is reversed:
the visible defects come from instructions the model faithfully carried out, built from data that was
wrong before it reached the prompt. Park City's Property Description shows a different photograph
from its section because its defaults block handed it two other pages' photographs, and it used them.

## The reference image

Attached on every generate call, retries included (measured on a logged call: a 1.2 MB PNG on both
attempts; ~1,600 input tokens unaccounted for by text, consistent with a 1440x648 image). It is the
representative member's crop, built once per component from `representativeCrop.cropRef`. It sits
last in the user message, after the system prompt (15,366 tokens) and the user text (~4,600).

Regenerate-with-instruction (refine) sent no image at all — fixed in `cf6b7088c7`.

## Defect: a missing reference image drops silently

`resolveImageFiles` in remote-components skips a file id it cannot read, or that is not an image, with
no error. The call proceeds and the model generates without its target. The generation log's "Images
attached" row (`2a121ef10a`) makes it diagnosable; it should be an error, not an omission. Same shape
as the silent paths already recorded for this pipeline: an unreadable override list treated as empty,
`reapplyStage` swallowing a failed apply, artifact keys read from the machine ref so corrections were
ignored, file-input values stringified to `[object Object]` with every check green, and a cut-off model
call leaving no result and no record.

## Contradictions found

| #   | One side (introduced by)                                                                                                                  | Other side (introduced by)                                                                                                 | What the model did                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1   | `images` prop examples are paragraph texts (Plan value binding)                                                                           | the pictures listed with their real alts (image facts)                                                                     | wrote paragraphs as `alt` values                                                            |
| 2   | defaults: 7 `images[]` entries, 2 URLs from other pages, other pages' headings as alts (Plan union of members; anti-stock defaults block) | the section's 3 real photographs listed as images no input carries (unbound images)                                        | used the 2 other-page photographs, none of the section's own                                |
| 3   | `section.background: surface-overlay` and measured `#363f54` (Plan binding; colours)                                                      | "painted with an image, not a colour"; "dark on transparent — keep it on a light surface" (background images; image facts) | used both; the image is a transparent pattern over navy, so the image-side claims are wrong |
| 4   | binding: heading uses `heading-2-*` variables (Plan binding)                                                                              | type scale: 52px and the site's family set directly (type scale; typography)                                               | unresolved                                                                                  |
| 5   | body text at 16-22px given `heading-3/5/6-size` (type scale, nearest size regardless of role)                                             | system: one variable per role                                                                                              | followed the mapping                                                                        |
| 6   | cross-family colour fallbacks: a background to `text-muted`, text to `surface-sunken` (colours)                                           | system: text tokens only on background tokens                                                                              | followed the mapping                                                                        |
| 7   | optional props observed only on other pages (Plan union)                                                                                  | "Show no other text" and the image                                                                                         | rendered other pages' content (Tulane's features list)                                      |
| 8   | system rule 11: class names, not inline styles                                                                                            | background images come from inputs and must be inline                                                                      | inline styles in 12 of 101, 11 of them backgrounds                                          |
| 9   | system: sensible defaults, 2-4 realistic example items, polished                                                                          | "Show no other text", "exactly as given"                                                                                   | invites invention; the prompt and validator now push back                                   |
| 10  | system: a token for every colour                                                                                                          | "no theme variable is near this colour, use #hex directly"                                                                 | followed the user prompt                                                                    |
| 11  | "Do NOT invent image URLs ... not in the list above"                                                                                      | URLs given in up to four separate lists                                                                                    | "the list above" is ambiguous                                                               |

## Order of work agreed

1. Image on the refine path — done, `cf6b7088c7`.
2. Rule 11 against input-driven backgrounds (#8) — done, `bcb0b9b36b`.
3. Data defects: #2 (done, `7bac68a985`, below), then #3, then #1 and #7, then #6 and #5.
4. Ablation of the prohibitions, widened, including components where a prohibition should not bind.

The token list and the worked examples are not cut: they are shared with the general system prompt and
the extraction-specific override is its own change.

## #2 result: defaults carry only the representative copy's values

Fix `7bac68a985`: each bound value records its source copy (`member`); Generate's defaults and the
unbound-image list read member 0 only; the union stays intact for every other reader. An alt field now
counts as filled by an item's picture, so a photo carousel outscores paragraphs.

- Offline replay, old against new binder on saved props and real trees, 94 components: 22 change,
  72 unchanged. Floor Plan Filter was put in the should-not-change set before the run and did not change.
- Plan re-run on Park City: **Plan is not variance-free.** It proposes props again on every run, and all
  8 components came back with renamed or reshaped props, so per-prop attribution is not possible from a
  re-run. The one prop that held its shape (Property Description `images: Image[]`) went from 7 items
  (3 paragraphs as alts, 2 other pages' photos, the section's 3 photos unbound) to member 0 = the
  section's 3 photos with their own alts, 0 unbound.
- Generate again, twice (~$0.50 each): both used GettyImages-172432728, -675343744, -957633616 with
  their real alts, and no other page's photo. Before: GettyImages-1375934212 and -517303040, paragraphs
  as alts. Both first attempts failed on invented `--wby-space-*` variables and passed on retry.
