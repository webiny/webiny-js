# Link destinations: result

Design and predictions: `link-wording-design.md` (committed before the run). 24 dry-run generations at
medium effort, $2.86 (priced with `src/domain/modelCost.ts`).

| Arm            | Runs | Invented URLs | What                                                                                   |
| -------------- | ---- | ------------- | -------------------------------------------------------------------------------------- |
| `link-current` | 8    | 1             | the Footer: `keyrealestateco.com/accessibility-statement`, plausible and not listed    |
| `link-new`     | 8    | **0**         |                                                                                        |
| `link-none`    | 8    | 2             | the Footer: `https://www.facebook.com`; a Contact Form: an `images.unsplash.com` photo |

**Shipped: the new wording** replaces "Do NOT invent image URLs" (`f3883fd4a2`). By the rule written
before the run, it beat no line (0 against 2); no line did not beat both, so the line is reworded, not
cut.

- **The reading that the current line invites URLs by discussing them is not supported.** No line
  invented more than the current line. The earlier 2 of 4 against 0 of 2 was noise at that size.
- **The image case is rare, not gone.** With no URL line at all, 1 stock photograph in 44 runs (this
  arm's 8 and the prohibitions pass's 36). The new wording has no image clause; its 8 runs had no image
  invention, which is too few to tell a 1-in-44 rate from zero. Watch for it, and measure an image
  clause if one appears.

All three predictions held: the current line invented on the Footer (1 of 3), no line 0 or 1 of 3 on
the Footer (1), the new wording 0 of 3.

Verified deployed by one real Generate on the Footer: the prompt carries the new wording and neither
removed line, the call logged effort `medium`, and the model-call log recorded it.
