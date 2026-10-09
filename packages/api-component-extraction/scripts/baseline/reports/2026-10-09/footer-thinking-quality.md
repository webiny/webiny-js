# Does a short-thinking answer differ in quality beyond passing the checks?

The first of the open questions in `footer-per-call-limit.md`. No model spend: the four stored Footer
answers on check-job run 3 were each installed back as the component (the dev-only install path),
rendered, and compared with the Footer's source crop.

## Findings that outrank the thinking question

1. **Wrong-slot text is upstream of the model, and survives the per-copy and alignment work.** C and D
   render "Copyright © 2026 Copyright ©" and put "Office Hours" or "2424 Tulane Apartments" among the
   bottom links. All four answers carry those entries in their link-list defaults, A and B included.
   They come from the run's Plan contract, whose observed values for the Footer's link lists are
   `legalLinks`: "2424 Tulane Apartments", ",", "Office Hours" and `socialLinks`: "2424 Tulane
   Apartments", "Corporate Logo", "Copyright ©", "Privacy Policy". A rendered the links correctly only by
   ignoring its own list. Not a thinking artefact, and every check passes it. Noted against
   `a-fifth-of-derived-props-show-another-slots-text.md` and
   `every-instance-of-a-component-gets-the-same-text.md`.
2. **Regenerate is a draw the operator cannot score.** The answer generated last stands, nothing compares
   it with the one it replaced, and the checks cannot tell them apart: here the original answer A was
   the best, and three regenerations replaced it with worse ones under the same green checks. Filed as
   `regenerating-can-replace-a-better-component-with-a-worse-one.md`, with the height ratio as a free
   partial signal (catches B at 2.03×, misses C and D) for after the 16th. It is not a quality measure.
3. **On this component, closest to the source and conforming to the contract pull in opposite
   directions.** A looked best because it wrote "Privacy Policy" and "Accessibility Statement" straight
   into its markup and ignored its own link-list prop. Of the four it is the least contract-conformant:
   those links cannot be edited through the component's inputs. The answers that follow the contract
   (C, D) render the contract's wrong values. So the visual ranking and conformance are in tension
   here, and that holds while the contract carries wrong data. "Best by eye" is not "best", and neither
   is "conforms".

## Method

- **Every answer was recorded before anything was installed.** The four stored answers, their attempt,
  output tokens, time to first text, and a hash of each answer's source went into
  `scratchpad/footer-quality/manifest.json`.
- **Installed and rendered in order A, B, C, D.** After each install the component's source hash was
  checked against that answer's hash before rendering. All four matched, so each render is of the answer
  it is labelled with.
- **Run 3 ends on D, its final answer, as it was.** The install path wrote its own entries into the
  generation log.

| Answer | Attempt                  | Output tokens | First text after | Source            |
| ------ | ------------------------ | ------------- | ---------------- | ----------------- |
| A      | original, attempt 2      | 28,383        | 228 s            | 15,797 characters |
| B      | regeneration 1           | **8,137**     | **5 s**          | 15,624 characters |
| C      | regeneration 2           | 28,357        | 232 s            | 12,478 characters |
| D      | regeneration 3 (current) | 27,462        | 210 s            | 14,361 characters |

## Result

**All four pass every check** (bundling, text preservation, contract conformance, token binding), all
render their 3 images, and none has a failed image request.

The source is the 2424 Tulane home-page footer, 1440 × 427: three columns (the "key." logo with a WCAG
badge; the property name, address, phone and three round social buttons; the "2424 Tulane" logo and
office hours), then a rule, "Privacy Policy | Accessibility Statement", and the copyright with two
housing icons.

| Answer                 | Render         | Against the source, by eye                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A                      | 1440 × 442     | **Closest.** All three columns, both logos, the badge, three social buttons (a pin where the source has a storefront), hours, the correct bottom links, copyright and both icons.                                                                                                                                                                                                    |
| C                      | 1440 × 474     | Columns right. The WCAG badge is missing. The bottom links read "2424 TULANE APARTMENTS \| Office Hours" instead of the source's. The copyright reads "Copyright © 2026 Copyright ©". The housing icons are missing.                                                                                                                                                                 |
| D                      | 1440 × 317     | Rearranged: the hours sit beside the "2424" logo, so it is 26% shorter. The bottom links gain two that are not in the source ("2424 Tulane Apartments \| Office Hours"). The same doubled "Copyright ©".                                                                                                                                                                             |
| **B (short thinking)** | **1440 × 869** | **Worst.** The "key." logo is unsized and fills the middle of the footer at about 450 px tall, which is why the render is twice the source's height. The layout is rearranged: the "2424" logo moves to the bottom left and the badge is enlarged top left. No social buttons. The bottom links read "2424 Tulane Apartments \| Office Hours" in place of "Accessibility Statement". |

## What it shows

1. **On this one sample, about 2K tokens of thinking produced a visibly worse component than about 22K,
   and the checks did not see it.** An unsized image, a lost row of buttons, rearranged columns and a
   wrong link set all pass. That is the shape the 63% finding warned about: checks green, component
   wrong.
2. **The long-thinking answers are not uniformly good either.** C and D render text in the wrong slot
   (heading and copyright text among the links, a doubled copyright), which the checks also pass. It
   comes from the Plan contract's observed values, not from the model (finding 1 above), so "more
   thinking" is not "correct". The short answer differs in kind: layout collapse, not wrong text in
   the right place.
3. **The run's final answer, D, is not its best.** A is closer to the source. Whichever answer was
   generated last is the one that stands, and the checks cannot tell them apart.
4. **The signal the checks miss is already measured.** The render records its height against the
   source's: B is 2.03×, D 0.74×, A 1.04×, C 1.11×. The Generate card shows both heights. Nothing
   treats the ratio as a check.

## What it does not show

- **It is one short-thinking answer.** That B is worse because it thought less is a hypothesis this
  supports, not establishes; one unsized image can happen at any length of thinking. Every Generate
  attempt now keeps its answer (it always did, see below), so further short-thinking answers will
  accumulate on ordinary runs and can be compared the same way.
- **"By eye" is my judgment on four images, not a measure.** The height ratio is the one number here,
  and it agrees with the eye for B and A but not for C and D, whose errors are text, not size.

## Correction recorded with this

An earlier claim (2026-10-09, in conversation only, never written to a report) said the generation log
kept each attempt's size and timing but not its answer. It was read off the log entry's field names
without opening the record each entry points to. The answers were all stored (`promptRef` →
`output.source`), which is what made this comparison possible at no cost.

## Found on the way, fixed

The render step read the website domain from Website Builder's old settings key. That key has not been
written since the frontend-settings port, so every render went to a dead tunnel and failed as "host
unreachable". It now reads the frontend settings first and keeps the old key as a fallback.
