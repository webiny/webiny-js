# Item 4: the instruction text, for reading before anything is deployed or generated

**Nothing here is deployed, and nothing has been generated.**

- **The five instructions are candidate lines.** Each has an id in `QUALITY_PROMPT_LINE_IDS` and is
  shown only when a run includes it. The default prompt does not carry them, so even a deploy by
  accident would not send them.
- **The sixth, image width and height, is not written,** because its data is not there. See below.
- Both decisions from the last report are built: the heading level is an input set per page, and the
  px line is conditional.

## Approved 2026-10-12, and what was built after

The instructions are approved as written. **Not deployed, and nothing generated,** until Sven decides
whether the generation run comes before or after the 16th.

- **Width and height: (a).** Composition writes the size each page draws the picture at into the image
  input's value: `{ url, width, height }`. On Take 3's Property Highlights Links that is 430×430 on the
  home page and 720×450 on the residents page.
- **What (a) does to older components: nothing, so it is not gated.**
  - A component that reads the input as a plain string still gets a plain string, unchanged; the
    string shape cannot carry a size.
  - An object-shaped value gains two keys. Of the 343 components in root and the six site tenants, 180
    have a file input. None spreads the value into an element, enumerates its keys, stringifies it, or
    reads `.width`/`.height`. The 10 that test its type do `typeof x === "string" ? x : x.url`, which two
    more keys do not change.
  - Composition's own image rewrite keeps the other keys (`writeUrl` spreads the record).
- **The sixth instruction** (`quality.image-size`), as proposed:

  > Every <img> sets width and height attributes from its image input (`image.width`, `image.height`),
  > so the page keeps its space while the picture loads; size it on screen with CSS as the layout needs.

- **The performance line is narrowed** to "Performance pass applied in generation: image dimensions
  set." No instruction was added to make the old wording true.
- **The Site step reads the per-run record.**
  - At publish, the build counts how many of the site's approved components carried each pass.
  - The accessibility and performance lines appear, with a beta label, only where the count is above
    zero. When only some components carried a pass, the line says "to 12 of 16 components".
  - 71 Westland today shows neither line.
- **The sub-heading limitation is recorded where it will be met:** in `headingLevelInput.ts`, beside the
  heading instruction, and in `ai-context/issues/sub-heading-levels-can-differ-between-pages.md`.

## Decided last round, built

**The heading level is an input composition sets per page.**

- **It needed no new plumbing.** For each instance, composition already has this page's own section
  node, the component's manifest and a free inputs record. The composite derivation already writes
  inputs it finds by reading the manifest.
- **What was added is one rule:** when a component declares `headingLevel`, set it to the level of the
  first heading in this page's section; with no heading there, the default stands (`headingLevelInput.ts`).
- **Tested on the real conflict:** Take 3's Property Highlights Links gets `h2` on the home page and
  `h1` on the residents page. The test fails when the level is fixed.

**The same gap, found and closed for alt.**

- A top-level image is filled per page, but a text input beside it was not, so its alt would be the
  representative page's alt on every page. Composition now sets `<name>Alt` from the same image it
  puts in `<name>`. Inside list and object items this already worked (`buildItem`).
- **A latent defect, found on the way:** the top-level image test matches by name, so `imageAlt`
  itself would have been taken for an image and filled with the picture's URL. Inside items, alt was
  already checked before image; at the top level it was not.
- **No component in any live Library has such an input today** (0 across root and six site tenants),
  so it never fired. The alt instruction would have given it its first trigger. The guard now matches
  `buildItem`, and both tests fail without it.

**"The largest is the section's heading at N px" is said only where it holds.**

- It stays only where the largest text matches a heading the source marks up.
- Replayed over 385 components, the line is dropped from 217 and kept on 72, and nothing else in any
  prompt changed. Of the 217:
  - 103 have no source heading;
  - 14 have a largest text that is not the heading (71 Westland's Hero Banner is one: its largest text
    is the display word "Awaits", and its h1 is smaller);
  - 100 come from plans that recorded no example text, so the line cannot be checked.

## The six instructions, verbatim

Each is shown only where the section has what it speaks about. Rendered for 71 Westland's Hero
Banner and Property Listings Gallery and Take 3's Contact Form and Site Navigation Header in
`scratchpad/item4/quality-show.txt`.

### 1. Alt from an input (`quality.alt-input`, where the prompt gives the section any picture)

> Every <img> takes its alt text from an input; none is written into the markup. Beside each image
> input, declare a text input named after it with "Alt" added (`image` → `imageAlt`, `logo` →
> `logoAlt`); inside a list or object item, add the same-named text field beside the image field.
> Default each to the alt given for that image above. An image given no alt above defaults to an empty
> string and renders alt="": it is decoration, and a screen reader skips it.

- **Data:** the alt beside each image in the prompt: 100% on plans that record unbound images,
  including all three demo runs.
- **Per page:** composition fills `<name>Alt` and the alt field of each item.

### 2. Semantic elements (`quality.semantic-elements`, every section)

> Use the element that says what each thing is: <a href> for anything that goes somewhere, <button> for
> an action that stays on the page, <ul> or <ol> around a set of like items (cards, links, features),
> <nav> around a set of navigation links, and <header> or <footer> as the outer element when this
> component is the site's header or footer. Never a <div> or <span> with a click handler.

- **Data:** none from the source, and none needed. It says what each element is for. The source's own
  tags are not passed for anything but headings.

### 3. Heading levels (`quality.heading-level`, every section)

Where the source marks up a heading:

> The section's main heading is the first one listed under its headings above. Render it with the
> element a `headingLevel` input names: declare `headingLevel` as a `createSelectInput` with the options
> h1, h2, h3, h4, h5 and h6, defaulting to "h2", and render it as `const Heading = inputs.headingLevel ||
"h2"`. Each page sets its own level. Every other listed heading keeps its distance from the main one:
> a heading listed one level below it renders one level below `headingLevel`, never deeper than h6.
> Text the list does not name as a heading is not a heading element, however large it is.

(The default is that section's own level, "h2" here for Take 3's Contact Form.)

Where it marks up none:

> The source marks up no heading in this section: render no h1–h6 element, however large its text.

- **Data:** the headings list.
- **Per page:** composition sets `headingLevel`.
- **Limitation:** "keeps its distance" holds for 8 of the 19 level conflicts. In the other 11, the
  headings below the main one also differ between pages, which one input cannot carry.

### 4. Form labels (`quality.form-labels`, where the layout has a form field)

> Every form field has a <label> tied to it (`htmlFor` on the label, the same `id` on the field),
> carrying that field's label from the text above. Where the crop shows the field with no visible
> label, keep the label and hide it visually (a visually-hidden class), so a screen reader still reads
> it. A placeholder is not a label.

- **Data:** the label text is in "Preserve this text", and the fields are in the layout. **Which label
  belongs to which field is not passed:** the model pairs them from the crop. Both property sites put
  each label right before its input, so pairing by order would work, but that is not built.
- Placeholders are not captured.

### 5. Focus outline (`quality.focus-visible`, every section)

> Every link, button and form field shows a visible focus indicator when reached with the keyboard: keep
> the browser's outline, or replace it in `:focus-visible` with one at least as visible (a 2px outline
> in the section's text colour). Never set `outline: none` without a replacement.

- **Data:** none from the source, and none claimed. The source's focus styles are not captured, so it
  asks for a visible indicator rather than the source's. The shared prompt already says "Include
  hover/focus states" (`buildComponentPrompt.ts:369`).

### 6. Image width and height: not written, because the data is not there

- **Why not:** composition writes a file input's value as `{ url }` (`fileInputValue`), so at runtime
  `image.width` and `image.height` are undefined. An instruction to set `width={image.width}` would
  render nothing, which is exactly the instruction-without-data pattern.
- **Two ways to give it data:**
  - **(a) Composition writes `{ url, width, height }`** from the size the image is drawn at on that page
    (its captured box), so the instruction reads real numbers per page.
    - _Caveat:_ that is the drawn size, not the file's. Natural size is not captured.
    - _Caveat:_ the string-shaped file inputs some older components read cannot carry it.
  - **(b) The instruction writes the measured size from the prompt** (the image facts give width × height
    px) as fixed attributes. That is per cluster, so it is wrong wherever a copy draws the image at
    another size.
- **Proposed text for (a):**

  > Every <img> sets width and height attributes from its image input (`image.width`, `image.height`), so
  > the page keeps its space while the picture loads; size it on screen with CSS as the layout needs.

## The per-run record

- **What is recorded:** each generated component records the quality ids its prompt carried
  (`qualityInstructions`), on its record and on its aggregate entry. Components generated without them
  record nothing.
- **What reads it:** this is what the Site step's beta lines will read, so a line appears only where
  the instructions ran: "applied in generation", or "to 12 of 16 components" if a site mixes.
- **Not built yet:** the reading side on the Site step. It waits on two things:
  - the decision on 6;
  - the performance line's wording. The approved wording says "image dimensions set, lean markup", and
    no instruction covers markup weight. As things stand, that line would claim two things that did not
    run.
