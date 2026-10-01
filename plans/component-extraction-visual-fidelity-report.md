# Component Extraction: component visual fidelity — diagnosis

Diagnosis only. Nothing in the generation prompt, the Plan contract or the validators was changed.

Measured across all four demo sites, latest run of each: Park city Palace (7 components),
2424 Tulane (13), 71 Westland (8), Freehill Street Lofts (6). **34 components in total**, each one
compared as source crop → standalone render → generated source.

**Two caveats apply to everything below, and are filed so this is not read as stronger than it is:**

- `renders-show-the-model-s-defaults-not-the-page-s-values` — no prop values are passed to the
  sandbox, so the renders show the model's own defaults. For text the two nearly coincide (95% of
  representative texts appear verbatim) and the text, type and layout findings are measured on the
  right thing. **The imagery finding is established from the Plan contract and the generated source;
  the renders illustrate it rather than confirming it.**
- `three-components-were-compared-at-mismatched-widths` — 31 of 34 crops are 1440px, matching the
  render width. Three on 2424 Tulane are 1300/1320px, so those three rows carry an unquantified width
  component. None of them is in the too-tall group that carries the union-text evidence.

---

## W1 — do the rendered images exist

**The mechanism existed; usable images did not.** W7.7's render path was built, but until the four
fixes earlier in this session it had never produced a component image that showed the component. At
the start of this work, renders existed for one site only (Park city Palace). They now exist for all
four: **34 of 34 render successfully.**

What producing the remaining 27 needed:

- **The website dev server was serving HTTP 500 for its own `/_next/static/*` chunks** — JS, CSS and
  fonts all returning an HTML error page. The sandbox HTML arrived, nothing hydrated, and every
  component failed with `Waiting failed: 30000ms exceeded`, which reads as a component fault rather
  than a server fault. Cleared `.next` and restarted; chunks then served 200 and every render passed.
- **Render passes must be run one site at a time.** Three concurrent passes against the one dev server
  produced 27 consecutive failures.

### Width parity with the source crop

31 of 34 crops are 1440px wide, matching the render width. **Three are not** — all on 2424 Tulane:
Site Header Navigation (1300), Hero Banner (1320), Floor Plan Filter (1320). Those three are
contained rather than full-bleed sections, so the crop is the element box. Their comparisons are
between two different layout widths and should be read with that caveat.

### Prop values from the representative member

**They are not used. Nothing passes prop values to the sandbox at all.** `RenderComponentInput`
carries `{ signature, name, source, css }`; the render pushes only the bundle, the theme CSS and the
light-mode flag. The sandbox places the component through `ElementFactory`, which uses the
**manifest's own `defaults.inputs`** — written by the model, not observed from the page.

For text this is nearly the same thing and the renders are sound evidence: **287 of 303 (95%) of the
representative's texts appear verbatim in the generated source**, and all of them do in 26 of 32
components. For imagery it is not the same thing at all — see Family 2.

---

## What the generation prompt and the Plan contract tell the model about appearance

The prompt (`componentGeneration.ts`, `buildPrompt`) gives the model:

- the sentence **"Reproduce the section shown in the reference image."**, with the crop attached;
- the prop list, each with up to three observed values;
- the theme CSS variables to use, as a hard allow-list (anything else fails validation);
- **"Preserve this text content exactly:"** followed by the text list;
- on a retry, the previous attempt's validation failures verbatim.

**It gives no measurement of anything.** Capture records every node's box and a token-relevant
computed-style subset — background, colour, font, spacing, radius. None of it reaches the prompt. The
model is never told the section's height, its type sizes, its gutters, its vertical rhythm, whether
it is full-bleed or contained, or what its images are.

And the three validators it is retried against — text preservation, contract conformance, token
binding — **check nothing about appearance**. The retry loop, which the code calls "the single biggest
lever on both pass rate and wasted attempts", optimises for everything except the subject of this
brief.

---

## W3 — the distribution

Render height ÷ source section height, across all 34:

|                        | count | share |
| ---------------------- | ----- | ----- |
| in band (0.67–1.5×)    | 20    | 59%   |
| **too tall** (>1.5×)   | 9     | 26%   |
| **too short** (<0.67×) | 5     | 15%   |

**This is not a few components failing badly.** 41% are structurally the wrong size, and the in-band
59% still drift on scale, spacing and imagery (Family 3). No component reviewed was a faithful
reproduction of its source.

Worst cases, with the text-inflation measure from Family 1 beside them:

| site             | component                    | source → render     | text required |
| ---------------- | ---------------------------- | ------------------- | ------------- |
| 71 Westland      | Explore Fenway Forward Intro | 202 → 1644px (8.1×) | 30.0×         |
| 71 Westland      | Accessibility Statement      | 546 → 2486px (4.6×) | 5.0×          |
| Park city Palace | Property Description         | 640 → 2642px (4.1×) | 6.0×          |
| 2424 Tulane      | Image Gallery Section        | 536 → 2141px (4.0×) | 15.5×         |
| 2424 Tulane      | Intro/About with Stats       | 570 → 2124px (3.7×) | 6.0×          |
| 2424 Tulane      | Location Description         | 826 → 2405px (2.9×) | 25.5×         |

---

## W2 — the attributed differences, in families

### Family 1 — the component contains other sections (9 components, the largest failure)

`PlanHandler` sets `sourceTexts: cluster.cluster.observedTexts` — **the union of every cluster
member's text** — while the reference image is one member. The prompt then says "reproduce the
section shown in the reference image" and, below it, "preserve this text content exactly" followed by
a superset of that section. The two instructions contradict each other and only the second is
enforced.

**11 of 34 components are required to emit more than 1.5× the texts their reference image contains;
7 are above 5×; the worst is 30×.**

71 Westland's _Explore Fenway Forward Intro_ is the clean example. The source is a 202px centred
intro — title, rule, two lines. The render reproduces exactly that in its first ~450px, and then
appends a property-chooser button row, a "Filter By" bar, a "Studio, 1 and 2 Bedroom Apartments"
block with disclaimers, and a complete "Contact Us" application block. Every one of those is another
cluster member's content.

Note what this means for the clusters that are _not_ affected: a nav or footer cluster whose members
are identical has a union equal to its representative, and scores 1.0×. The defect only bites where
members share a layout and differ in content — which is the normal case for body sections.

### Family 2 — the customer's photography is gone, and stock has been substituted (21 of 34)

- **21 of 34 components declare at least one Image prop; 36 Image props in total; 0 of them carry an
  observed value.**
- Capture records `src` and `alt` on every `img`/`source`/`video` node. **The Plan stage never reads
  either** — prop derivation runs over text runs only, so an Image prop is proposed by the model from
  the crop and then has nothing to fill it.
- The model fills the gap itself: **12 components ship 27 hardcoded `images.unsplash.com` URLs**
  inside their manifest `defaults.inputs`. Those are what the renders show, and they are what Promote
  would put in the customer's Library.

This is the difference a customer notices first and the one that is least defensible. Park city
Palace's footer loses its Connecticut Housing Partners logo, its equal-housing and accessibility
icons and its W3C badge — and the whole vertical band they occupied, which is most of why it renders
at 193px against the source's 460px. Freehill's hero replaces the property's own pool and building
with a stock modern villa.

Two secondary losses travel with it. In both heroes reviewed the **dark scrim over the image is
absent**, so white heading text sits on a bright photo and legibility drops. And in Freehill's hero
the text column is wider than the source's, so a deliberately balanced two-line heading re-breaks in
the wrong place.

### Family 3 — scale and spacing drift (the in-band majority)

The in-band components are recognisable as their sections and wrong in the same way: everything is a
size or two small and the inner padding is short.

Park city Palace's _Hero Banner_ has the right structure, the right eyebrow/heading/CTA, and the CTA
even in the right terracotta — but the heading is visibly smaller, the button has much less padding,
the content block sits lower in the frame, and the left gutter is 36px against the source's 115px.
Its _Property Highlights Grid_ is the most faithful component reviewed — three columns, olive
headings, olive buttons, correct labels — and still differs on type scale, button padding and
background tint.

This is what a prompt with no measurements produces: the model reads structure and colour off the
crop accurately, and guesses everything dimensional.

### Family 4 — non-content strings asked for as content (16 of 34)

`isNonContentText` in `validators.ts` excludes icon-font ligatures and punctuation-only strings from
the text-preservation check, with a comment stating that requiring them "measures nothing about
fidelity". **The exclusion was applied to the validator and not to the prompt.**

16 of 34 components are told to preserve such strings — 27 in total, including `keyboard_arrow_down`,
`attach_money`, `chevron_left`, `chevron_right`, and bare `.` and `,`. They are duly rendered as
literal words: they are visible in 71 Westland's filter bar as "Bedrooms keyboard_arrow_down",
"Bathrooms attach_money" and "refresh Reset Filters".

### Family 5 — the reference crop is not the component (at least 1)

2424 Tulane's _Specials Section_ has a 1440×900 crop of the whole homepage hero, because the only
direct text in that region is the word "SPECIALS" on a small fixed-position tab at the left edge. The
generated component is that tab, correctly. It reports a document height of 0 because the tab is
absolutely positioned, and is recorded as a successful render. This is a Segment defect reaching the
Generate view disguised as a generation defect.

---

## On the similarity score — since removed

Out of scope as an output, but it needed flagging because it pointed reviewers away from all of the
above. It was a 64×64 greyscale mean-absolute-difference, so it tracked average brightness:

- 71 Westland _Explore Fenway Forward Intro_, the **worst** structural failure at 8.1× too tall → **0.97**
- Park city Palace _Site Footer_, 2.4× too short with every image missing → **0.97**, the highest on its site
- Park city Palace _Property Highlights Grid_, the **most faithful** component reviewed → **0.80**

Mean score by band: too tall 0.73, too short 0.81, in band 0.86. The bands barely separate, and
within them the ordering is close to inverted.

It has been removed from the Generate view and is no longer computed. The card now states the
render's height against its section's, measured rather than derived, with no bar and no threshold
colour — see `the-similarity-score-rewarded-the-failures-it-should-have-caught`.

---

## My reading of the cause, ranked

1. **Clustering plus union text.** The biggest single cause of visible failure, responsible for most
   of the 26% that are too tall. It is not a prompt problem — the prompt is faithfully carrying out
   a contract that asks for one section's picture and many sections' words.
2. **Images are never derived.** A pipeline gap, not a model one: the data is captured and dropped.
   It is the difference a customer sees first, and it ships third-party stock URLs into their Library.
3. **No measurements in, no appearance checked on the way out.** Scale and spacing drift is
   unconstrained at generation and invisible to the retry loop, so it never improves across attempts.
4. **Non-content strings leak into the preserve list** — a mitigation wired into the validator and
   not into the prompt.
5. **Segment occasionally hands over a crop that is not the component**, which then reads as a
   generation failure.

Ordering note: fixing 3 without fixing 1 would make well-proportioned components that still contain
four other sections.
