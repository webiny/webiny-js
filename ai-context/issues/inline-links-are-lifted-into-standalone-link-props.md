# Inline links are lifted out of their paragraphs into standalone Link props

> **Package:** `@webiny/api-component-extraction` (Plan's props and observed values)
> **Severity:** medium. Plan lifts **every** inline link it sees. The lifted phrase either leaves a sentence
> in pieces that render whole only if the component puts them back in order, or is held twice and shows twice.
> **Status:** open, 2026-10-10. Held with the wrong-slot work; measured, not fixed.

## What happens

A link inside running text is a phrase of that sentence. Plan makes it a standalone Link prop, in one of two
shapes.

### 1. The sentence is split, and the pieces can land in the wrong props

The link is lifted and the rest of the sentence is kept without it. Nothing shows twice, so nothing
announces it. Whether the sentence renders whole depends on the component putting the pieces back together,
in order, from the right props. That can be seen only against the source.

- **Contact Us Form.** The source sentence is "By submitting this form, you agree to the
  [privacy policy]."
  - **What Plan recorded:**
    - `privacyText` gets "By submitting this form, you agree to the" and, as a second value, the lone ".";
    - "privacy policy" goes to `mapLink`, not `privacyLink`, which has no observed value at all;
    - the privacy-policy URL ends up behind the link labelled "Map & Directions".
  - **What the generated component did:** it re-joins the sentence as `{privacyText} {privacyLink.label}`,
    from defaults it wrote itself. So it reads whole in the component's own preview, while on a page the
    pieces come from the misplaced values.
- **Property Description.** "Community amenities" opens the sentence "Community amenities include a
  combined laundry and lounge area…".
  - Plan keeps the rest of the sentence as a `description` value without it.
  - It records the phrase twice more, as `amenitiesHeading` and as `cta`.
  - The component re-joins them with the remainder hardcoded in its markup.

A sentence held in pieces is only as correct as each piece's slot, and it fails silently when any piece is
wrong. The two cases above were not checked rendered with page values. Their generated sources re-join the
sentence, and that is all that is claimed.

### 2. The phrase is held twice, and shows twice

The link is lifted _and_ the paragraph keeps the phrase. Park City's Neighborhood/Location Highlight:

> Whether you're an adventurer or a total homebody, you'll love **[our ideal location]** in Bridgeport…

- **Capture is right.** It records `<p>…you'll love <strong><a>our ideal location</a></strong> in
Bridgeport…</p>`.
- **Plan holds the phrase twice.** It makes `imageLink` (Link: "our ideal location", "your new home",
  "in-home features") and keeps the paragraph in `body` with the phrase still in it.
- **The component renders both:** inline in the paragraph, and again as a line underneath.

This shape announces itself; it is how the defect was found.

## Not the link-list defect

[`a-fifth-of-derived-props-show-another-slots-text.md`](./a-fifth-of-derived-props-show-another-slots-text.md)
and the link-list measurement (`reports/2026-10-09/link-list-observed-values.md`) are about **wrong text**
in a Link prop: copyright lines, headings and form labels where link labels belong. Here the text is right:
it is a real link's real label. That measurement scores each of these as "link label: exact" and counts it
correct, so it could not see this defect.

The fault is one sentence treated as separate pieces. It shares a family with the doubled copyright (one
piece of content in more than one slot), but the cause is how Plan treats a link inside running text, not
what text it picked.

## How often, on ParkCity - Take 3

Offline, over the stored plan and captured trees, no model spend.

- **31** observed Link values; **6 are inline links in running text**, in **4 of the 16** components.
  **All 6 were lifted.**
- **Split, sentence kept without the phrase (2):** Property Description's "Community amenities" and
  Contact Us Form's "privacy policy".
- **Held twice, phrase also inside another prop (4):** "our ideal location" and "in-home features" in `body`;
  "your new home" and "ultimate neighborhood" in `heading`. These are in Neighborhood/Location Highlight and
  Neighborhood Perks Section.
- **Rendering twice:** confirmed by eye on Neighborhood/Location Highlight only. Counting a phrase in a
  generated source is not a render, and is not reported as one.

**The 6 is this site's supply of inline links, not a selection rate.** Plan lifted every one it saw. Take 3
has little body copy with links in it; a text-heavy site will show proportionally more. No other site was
counted.

### How "inline" was decided: two measures were wrong before this one

1. **"The link's parent has more text than the link" flagged navigation.** A menu's container holds the
   other links' text, so every nav link passed as "inline".
2. **"The link's direct parent has text of its own" missed the known case.** Capture records the
   real link as `<p>…love <strong><a>our ideal location</a></strong> in…</p>`, and the `<strong>` carries
   no text.
3. **Reported rule:** read up through text-less inline wrappers (`strong`, `em`, `b`, `i`, `span`, `u`) to
   the first ancestor with text of its own, and count the link as inline when that text has three or more
   words. It finds the known case, and no button merely beside a heading.

The reported count is only as good as rule 3, and rule 3 was tested on one known case.

## Where the fix sits

Upstream, in Plan: a link with sentence text around it belongs to that sentence's rich text, not to a Link
prop of its own. Held with the wrong-slot work until after 16 October.
