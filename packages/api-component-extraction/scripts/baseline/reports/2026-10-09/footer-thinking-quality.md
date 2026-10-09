# Does a short-thinking answer differ in quality beyond passing the checks?

The first of the open questions in `footer-per-call-limit.md`. No model spend: the four stored Footer
answers on check-job run 3 were each installed back as the component (the dev-only install path),
rendered, and compared with the Footer's source crop.

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
2. **The long-thinking answers are not uniformly good either.** C and D carry the text-in-the-wrong-slot
   errors (link labels taken from headings, a doubled copyright) that the checks also pass. So "more
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
