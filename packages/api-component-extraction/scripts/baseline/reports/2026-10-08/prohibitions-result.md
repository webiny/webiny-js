# The three content prohibitions: result

Design and predictions: `prohibitions-design.md` (committed before the runs). Re-clustered check run,
dry-run, medium effort (logged on every call), two repeats: 134 generation runs, $18.31 reported
against an estimate of about $23. Each arm ran only on the components where its line is shown.

| Arm                       | Runs | First-attempt pass | Invented-text validator (1st attempt) | Rendered text not in the prompt | URLs not in the prompt | Background URL verbatim, as a background |
| ------------------------- | ---- | ------------------ | ------------------------------------- | ------------------------------- | ---------------------- | ---------------------------------------- |
| base                      | 42   | 38/42              | 0                                     | 2 runs                          | 1 run (a link)         | 14/14                                    |
| without `no-other-text`   | 42   | 34/42              | **2**                                 | **6 runs**                      | 1 run (a link)         | 14/14                                    |
| without `no-invented-urls`| 36   | 33/36              | 0                                     | 3 runs                          | **0**                  | 10/10                                    |
| without `urls-exactly`    | 14   | 14/14              | 0                                     | 2 runs                          | 0                      | **14/14**                                |

"Rendered text not in the prompt" renders each output's defaults and lists text that appears nowhere in
its prompt. It sees what the validator cannot: single words (the validator needs two or more) and text
from other copies (the validator's pool includes them). Dropdown options are excluded, as the validator
excludes form content: they are the site's, uncaptured. Every flag was read in the output and checked
against the captured page before it was counted.

## `no-other-text`: live. Keep.

Without it, the model wrote what prediction 1 named, on the valueless props:

- the carousel's valueless call to action as **"Schedule a Tour"** (Hero Section), and the Footer's
  accessibility badge as visible text, **"W3C WAI WCAG 2.2 AA"**. Both caught by the validator and
  retried away; neither occurs in 42 base runs;
- **"Send"** on the tour form's valueless submit button (2 of 2 runs; 0 of 2 at base);
- a mock **"I'm not a robot" / "reCAPTCHA"** widget (1 of 2 runs). The tour section does have that
  widget (a 304x78 reCAPTCHA iframe in the capture), so this is visible text the capture cannot read,
  not invention in the line's sense. The line also suppresses that, which is the right outcome here.

The 3 extra "missing text" failures in this arm are the converse of what the line guards, and are not
attributed to it.

**What the line does not stop.** "Send" on Contact Form's valueless submit button ships in every arm,
base included (4 of 4 runs on one form, and on the other in both arms without a prohibition). A single
word on a button with no captured label is invisible to the validator and not prevented by the line.
That is wrong data in the prompt (Plan captured no label for the button), fixed in the data, not by
wording.

## `no-invented-urls`: its image case is gone; its link case is real and the line does not stop it.

- **Images: 0 invented in 36 runs without the line**, 0 in 42 with it. Every image prop now arrives with
  its URL; what the line was written for (12 of 34 components with stock URLs) was removed upstream. At
  this resolution the line does nothing for images: 0 in 36 bounds the rate below about 8% (95%).
- **Link destinations: one invented, with the line present.** The Footer's valueless `socialLinks`
  prop was given `https://www.facebook.com` (base 1 of 2, and 1 of 2 in the `no-other-text` arm, which
  keeps this line), and 0 of 2 without it. The case is real and currently unmentioned: the line says
  "image URLs", and its "no URL that is not in the list above" did not stop a destination.

So not "dead": **reword to the case it still covers** (a link the section shows without a destination
keeps an empty destination, rather than a plausible one) and measure that wording on the valueless
links, rather than keep the image wording or cut the line.

## `urls-exactly`: dead at this resolution. Cut.

14 of 14 use the background URL verbatim, as a background, without either wording, as with them.
Dead at this resolution, on single-copy components, bounding the rate rather than proving zero (0 in
14 bounds it below about 19%). The line that hands over the URL and says "set it as a CSS
background-image" does the work.

## Against the predictions

1. **Confirmed.** Invented text rose from 0, on the valueless props, mostly as link labels.
2. **Confirmed for images** (0). Links: 0 without the line, 1 with it: the line is not what prevents it.
3. **Confirmed.** 14 of 14.

## Two process notes

- One request starting 21 tasks outran the API gateway: it returned an HTML error page, and 14 of the
  21 tasks had started anyway. Retrying blind would have double-run 14. The arms now start in batches of
  5, and what a failed request started is read from the log before anything is retried.
- The progress monitor's process check matched its own command line, so "runner exited" could never
  fire. Fixed to match only the runner.
