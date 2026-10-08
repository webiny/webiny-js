# The three content prohibitions: design and predictions

Written before any run. These three lines have never been measured; the ablation design left them
"unmeasured, not assumed to work", to be measured on re-clustered runs.

| Id (to add)                    | Line, in Generate's user prompt                                                                                         | Shown on                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `extraction.no-other-text`     | "Show no other text. Do not add a heading, a button, a caption or a sentence the section does not have…"               | every component                              |
| `extraction.no-invented-urls`  | "Do NOT invent image URLs. No stock photography, no placeholder services, no URL that is not in the list above…"       | components with observed images or links     |
| `extraction.urls-exactly`      | "Use these URLs exactly as given. Do not substitute a stock photograph…" and its see-through form, "Use the URL exactly as given…" | components with a background image |

## What each would still guard against on a re-clustered run

Three passes found a line that looked load-bearing because it was absorbing a defect elsewhere. These
three guard against content that should not be in the contract, and re-clustering removed much of that
content: on the check run, props a contract carries that its section lacks went from 16 to 4, and
other-page text to 0. So before measuring, what is left for each to do, read from the prompts Generate
actually sent on the re-clustered check run (21 components, 111 props) and from their outputs:

**`no-other-text`: still exposed, on two counts.**

- *Removed by upstream fixes:* other copies' text. Re-clustering and the representative-only samples
  (#1/#7) took it to 0; the line no longer has that to absorb.
- *Left:* props that reach the prompt with no value from the section: **12 props in 9 components**
  (8 links whose label the model must write, 3 text props, 1 map point). Two kinds, counted apart so
  neither is quoted against the other:
  - **4: the contract carries what the section lacks.** Other copies in the cluster have a value, the
    representative does not: `sidebarHeading`, `sidebarLinks`, `featureList` (tabbed panels merged into
    "Contact Form") and `subheading` (on 3 of 7 copies). This is the clustering measure (16 before
    re-clustering, 4 after), the same 4 props.
  - **8: the section has the element, Plan captured no value.** Present on every copy, or 8-9 of 11,
    with no text or destination observed: an icon-only menu toggle, the carousel's two arrow "CTAs",
    two submit buttons and a privacy link on single-copy forms, the Footer's map point and social icon
    links. Clustering cannot change these. Each invites a label or a destination the section does not
    show.
- *Left, and untouched by clustering:* the reflex to add a plausible heading or call to action. Every
  component is exposed to it.
- Backed by a validator (`validateNoInventedText`): with the line, **0 of 31** stage attempts failed it.
  Without it, an effect shows as first-attempt failures and retries, not as shipped text.

**`no-invented-urls`: mostly absorbed upstream for images; still exposed for link destinations.**

- *What it was written for:* image props with no URL, where the model wrote stock URLs (12 of 34
  components before structured defaults existed). On this run, **0 of 9 image props lack their URL**:
  structured defaults removed what the line was guarding against.
- *Left:* link props with no destination (the 8 valueless links above). Its wording, "no URL that is
  not in the list above", covers destinations as well as images.
- **No validator.** With the line, **0 of 21** outputs contain a URL that is not in their prompt. An
  invented URL would ship, invisible to pass rates.

**`urls-exactly`: exposure unchanged by clustering.**

- It guards a URL the prompt gives (the section's own background), against substitution or flattening
  to a colour. Clustering never touched that: **7 components** (2 photographs, 5 see-through images).
  With the line, 7 of 7 use their URL verbatim, as a background.
- Its question is a different one: whether a line that hands over the URL and says "set it as a CSS
  background-image" already does the work, leaving "exactly as given" redundant.
- **No validator.**

## Arms

Dry-run experiments on the re-clustered check run, at the shipped effort (medium), each line ablated by
its id. Default prompt output must stay byte-identical (a test, as for the earlier ids).

| Arm                | Components                                  |
| ------------------ | ------------------------------------------- |
| `proh-base`        | all 21                                      |
| `proh-other-text`  | all 21 (the reflex is universal)            |
| `proh-urls`        | the 18 where the line is shown              |
| `proh-exactly`     | the 7 where it is shown (both wordings)     |

Two repeats: 134 generation tasks. At medium, about $0.17 a component: **about $23**.

## Measures (in the outputs, not pass rates)

- `no-other-text`: first-attempt failures of the invented-text validator, and the text it names;
  attempts per component.
- `no-invented-urls`: URLs in the output not in the prompt, split into image sources and link
  destinations; placeholder and stock hosts named.
- `urls-exactly`: the background URL present verbatim and used as a background; flattened to a colour.
- All arms: first-attempt pass, attempts, cost.

## Predictions

1. **`no-other-text` removed:** invented-text failures rise from 0, concentrated in the 9 components
   with valueless props, mostly as link labels the model writes.
2. **`no-invented-urls` removed:** invented image URLs stay at 0 (no image prop lacks its URL). Link
   destinations: at most a few invented, on the valueless links.
3. **`urls-exactly` removed:** 7 of 7 still use the URL verbatim, as a background.

## Decision rule

A line whose removal changes nothing on its exposed set is **dead at this resolution, on single-copy
components, bounding the rate rather than proving zero**, and is cut, as the earlier dead lines were.
A line that shows an effect stays. Prediction 2 would make `no-invented-urls` dead for images and live
for links: then the line is reworded to the case it still guards, not kept for the one it no longer
does.

Not decided here, and recorded: the binder oddities are in these prompts too (the Footer's
`phone: "null"`, a link labelled `","`). That is wrong data in the prompt, and is fixed in the data,
not by a prohibition.
