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

| #   | One side (introduced by)                                                                                                                  | Other side (introduced by)                                                                                                 | What the model did                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `images` prop examples are paragraph texts (Plan value binding)                                                                           | the pictures listed with their real alts (image facts)                                                                     | wrote paragraphs as `alt` values                                                                                                                                                                                                                                                                                                                                                               |
| 2   | defaults: 7 `images[]` entries, 2 URLs from other pages, other pages' headings as alts (Plan union of members; anti-stock defaults block) | the section's 3 real photographs listed as images no input carries (unbound images)                                        | used the 2 other-page photographs, none of the section's own                                                                                                                                                                                                                                                                                                                                   |
| 3   | `section.background: surface-overlay` and measured `#363f54` (Plan binding; colours)                                                      | "painted with an image, not a colour"; "dark on transparent — keep it on a light surface" (background images; image facts) | used both and painted the whole section navy. Corrected 2026-10-07: the image is a faint white pattern (mean alpha 31/255, no opaque pixel) over the page's light backdrop, and the navy is a panel in front of it behind the text. "Dark" is `measureTone`'s value when no pixel is opaque, and the light backdrop was dropped because a node with a background image counts as fully painted |
| 4   | binding: heading uses `heading-2-*` variables (Plan binding)                                                                              | type scale: 52px and the site's family set directly (type scale; typography)                                               | unresolved                                                                                                                                                                                                                                                                                                                                                                                     |
| 5   | body text at 16-22px given `heading-3/5/6-size` (type scale, nearest size regardless of role)                                             | system: one variable per role                                                                                              | followed the mapping                                                                                                                                                                                                                                                                                                                                                                           |
| 6   | cross-family colour fallbacks: a background to `text-muted`, text to `surface-sunken` (colours)                                           | system: text tokens only on background tokens                                                                              | followed the mapping                                                                                                                                                                                                                                                                                                                                                                           |
| 7   | optional props observed only on other pages (Plan union)                                                                                  | "Show no other text" and the image                                                                                         | rendered other pages' content (Tulane's features list)                                                                                                                                                                                                                                                                                                                                         |
| 8   | system rule 11: class names, not inline styles                                                                                            | background images come from inputs and must be inline                                                                      | inline styles in 12 of 101, 11 of them backgrounds                                                                                                                                                                                                                                                                                                                                             |
| 9   | system: sensible defaults, 2-4 realistic example items, polished                                                                          | "Show no other text", "exactly as given"                                                                                   | invites invention; the prompt and validator now push back                                                                                                                                                                                                                                                                                                                                      |
| 10  | system: a token for every colour                                                                                                          | "no theme variable is near this colour, use #hex directly"                                                                 | followed the user prompt                                                                                                                                                                                                                                                                                                                                                                       |
| 11  | "Do NOT invent image URLs ... not in the list above"                                                                                      | URLs given in up to four separate lists                                                                                    | "the list above" is ambiguous                                                                                                                                                                                                                                                                                                                                                                  |

## How row 3 was got wrong

Row 3 first said the image was "a transparent pattern over navy". That was inferred from the generated
component's render, while the source crop was available. The crop shows the opposite. Reasoning from a
model's output back to its input is the inference this diagnosis exists to check, and it is how an
earlier measure was got wrong too. Describe the source from the source artifact.

## Order of work agreed

1. Image on the refine path — done, `cf6b7088c7`.
2. Rule 11 against input-driven backgrounds (#8) — done, `bcb0b9b36b`.
3. Data defects: #2 (done, `7bac68a985`, below), then #3 (done, `ebbc2893bb`, below), then #1 and #7 (done, `95eb1116db`, below), then #6 and #5.
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

## #3 result: see-through background images keep the colour behind them

Fix `ebbc2893bb`. A background image was assumed to cover what is behind it. `measureTone` reported a
picture with no opaque pixel as "dark" (the empty average, 0). Cluster now measures every background
image on a page, and one below 0.5 mean opacity no longer hides its element's colour or the backdrop.
Plan records the colour measured where each see-through image is drawn, and Generate words these
images apart from photographs.

- Threshold sweep, all 139 readable background images on the planned pages: every one is at or below
  0.33, or exactly 1.00. Any threshold above 0.33 gives the same result. This is a property of the
  images, not of this sample: the parameter does not need tuning and should not be revisited unless that
  distribution changes (an image measured strictly between 0.33 and 1.00).
- Offline replay, all 95 components (94 of 95 reproduce the stored colours; the miss is a stale
  check-run header): 12 prompts change.
  - 3 predicted: Park City Property Description, Tulane Property Highlights Links, check-run Tulane
    FAQ Section.
  - 9 not predicted, from the should-not-change set. **A finding, not only a miss:** 9 thevibe
    sections had no background colour at all, because a 5% texture on the page `<body>` hid the white
    backdrop behind them. Their crops are white (dominant `#f8f8f8`), so the change is correct. The
    prediction failed because the model of the defect did not include a see-through image on a parent
    element, which is a real gap in the model being tested, not only in the forecast.
  - The first wording named the section's largest colour as the one under the pattern. For Park City
    that is navy, which would have reinstated the corrected navy claim from row 3 inside the fix for
    it. The replay caught it, and Plan now measures the colour where the image is drawn. This is the
    second time in two passes that a correction was nearly undone by the fix built from it: replay the
    fix against the case that prompted the correction, not only against the cases it was written for.
- Park City, Plan re-run on the deployed code: pattern opacity 0.12, light, colour under it `#f7f7f9`
  (`surface-sunken`). Generated twice (~$0.50, ~$0.40): both paint the section `surface-sunken` with the
  pattern, and navy on the text column. Before: the whole section was navy.

**Park City's Property Description is not fully fixed.** Its navy panel is drawn by something the
capture does not record (most likely a pseudo-element). The only navy element captured is the 660x520
text column, so nothing tells Generate that the navy extends behind the photograph. The background
colour is now right; the panel's extent is not conveyed. Being in the should-change set means the
prompt changed as predicted, not that the component is now correct.

Not yet regenerated: the two Tulane sections. Their colours come from Cluster, so Cluster, Classify and
Plan must re-run first, and Classify and Plan call the model again (see `../../VERIFYING.md`).

Sized, not fixed. Both are the same shape — something outside the section, or larger than it,
reported as the section's background — and the carousel case is the larger of the two:

- Tulane's `circle-background5` is a 780x900 absolutely positioned element listed as the background of
  2 components, both Tulane baseline headers, at 2.1x and 8.1x the header's area. No other component
  in the 95 has a background image larger than its section.
- Carousel slides positioned off-canvas: 3 thevibe components (Carousel/Slider, Hero Intro, Image
  Slideshow) list 19 slide images that sit wholly or partly outside the section box as "the section's
  background".

## #1 and #7 result: Generate shows only the values its own section has

Fix `95eb1116db`. Plan's model writes a text prop's values from every copy's text, and Generate showed
the first three as examples. The model built them in. Measured on text props across 95 components
(the representative's texts read from its full page tree, so the 40-text digest cap could not bias
it; editor metadata such as input labels and `aiContext` excluded from the output check): 25 strings
from other copies in 8 components, all 25 through the examples. They include another page's address,
phone number and lead form on check-run Tulane's hero, other buildings' names and disclaimers on
Westland's intro, and another page's feature bullets on Tulane's description. That is a migrated site
showing another property's content, not a fidelity blemish.

- Each value is attributed to a copy from the texts the plan holds. A value only another copy has is
  no longer an example; a prop the representative has no value for is told to default to empty.
- **#2 was in effect on 1 of 8 runs** — a fix verified on the case it was built from, correct there, inert everywhere else; the replay would have caught it had it covered plans made before the tags existed (`../../VERIFYING.md`). Its member tags exist only on plans made after `7bac68a985`,
  and `representativeValues` read an untagged value as the representative's. Only Park City has been
  re-planned since. Untagged values are now attributed by their text (label, alt, item fields).
- Freehill's "(346) 489-6939" is not another property's number: the representative writes the same
  number as 346-489-6939, the privacy-policy page with brackets.
- Replay, all 95: the 20 predicted change (17 named first, 3 more named before the run once untagged
  defaults were included), the other 75 are byte-identical. The replay also caught nulls in saved item
  fields that would have crashed Generate.
- Generate twice each on check-run Tulane Hero Section, Westland Intro/Explore and Tulane Property
  Description with Scores: 6 of 6 contain none of their other-copy strings (before: 8, 6, 4). One run
  of the last failed validation on invented `--wby-space-*` variables and two of its own texts missing,
  unrelated to other copies' values and not attributable from one occurrence.

**The two strings that did not come through examples** were both "phone number", and both are
artifacts of the first measure, which matched editor metadata: one is Park City Contact/Apply Bar's
`aiContext` description, the other an input's `label`. So no path from outside the prompt was found.
Truncation to three examples can still hide a value, but no leak in this data went that way.

**Examples that match no copy.** 56 of 676 text examples across all 95 components; 48 are
configuration values the page holds as attributes (`tel:` links, `_blank`, colours, booleans). Of the
8 prose values, 3 are on the page outside the capped per-copy texts; 5 are not on any stored page tree,
but only representatives' pages are stored, so they are unproven as invented. Not worth its own pass
at this size; checking those 5 against every member's page would settle it.

Found on the way:

- `next`'s audit logs were written to the main table (`AuditLogsDdbFeature` passed `DB_TABLE`), so
  every audited write failed after the merge was deployed, file creation included; every generation
  was a silent no-op logged as info. Fixed in `81c5d0ad6e`; belongs upstream.
- Cluster grouped check-run Tulane's photo carousel with heroes that carry a lead form, which is why
  its contract has address, phone and form props at all. Clustering is upstream of defects fixed
  downstream. The threshold could not have separated them: the fingerprint's type tree stops at depth
  6 and their content starts at 8-9, so it sees only wrappers (tree similarity 1.00). Filed as
  `ai-context/issues/a-depth-capped-fingerprint-sees-only-wrappers.md`; 34 of 95 representatives are
  exposed, concentrated on the G5 template.
