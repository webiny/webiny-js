# Inline links are lifted out of their paragraphs into standalone Link props

> **Package:** `@webiny/api-component-extraction` (Plan's props and observed values)
> **Severity:** medium. Visible as a phrase shown twice, inline and again on its own line.
> **Status:** open, 2026-10-10. Held with the wrong-slot work; measured, not fixed.

## What happens

Park City's Neighborhood/Location Highlight has a paragraph with a link inside it:

> Whether you're an adventurer or a total homebody, you'll love **[our ideal location]** in Bridgeport…

Capture records it faithfully, as `<p>…you'll love <strong><a>our ideal location</a></strong> in
Bridgeport…</p>`. Plan then makes the link a standalone prop (`imageLink`, type Link, observed "our ideal
location", "your new home", "in-home features") _and_ keeps the paragraph in `body` with the phrase still in
it. The component faithfully renders both: the phrase inline in the paragraph, and again as a line
underneath.

## Not the link-list defect

[`a-fifth-of-derived-props-show-another-slots-text.md`](./a-fifth-of-derived-props-show-another-slots-text.md)
and the link-list measurement (`reports/2026-10-09/link-list-observed-values.md`) are about **wrong text**
in a Link prop: copyright lines, headings and form labels where link labels belong. Here the text is right:
it is a real link's real label. That measurement classes each of these values as "link label: exact" and
counts it correct. It could not see this defect.

The fault is **one link extracted twice**, once inside its paragraph and once on its own, so the same
content has two slots. It shares a family with the doubled copyright (the same text in two places), but the
cause is how Plan treats a link inside running text, not what text it picked.

## How often, on ParkCity - Take 3

Offline, over the stored plan and captured trees. A Link value counts as inline when its `<a>` has
paragraph text of its own around it, read through text-less inline wrappers (`strong`, `em`, `span`, …).
That rule finds the known case and nothing else structural; buttons beside a heading do not count.

- **31** observed Link values. **6 are inline links in running text**, in **4 of the 16** components.
- **4 of the 6 are also kept inside another prop's value**, so the phrase is held twice: "our ideal
  location" and "in-home features" in `body`; "your new home" and "ultimate neighborhood" in `heading`.
  These are in Neighborhood/Location Highlight and Neighborhood Perks Section.
- **The other 2 are split instead.** Property Description's "Community amenities" and Contact Us Form's
  "privacy policy" have the link lifted and the surrounding sentence kept without it. Lifted, but not
  duplicated in the plan.

Not established: how many of the 4 duplicated values render twice. That was confirmed visually on
Neighborhood/Location Highlight only. Counting the phrase in the generated sources is not a render, and is
not reported as one.

**Exposure is per site, not per component.** An inline link in body copy is common, so a site with more
running text would show more. Take 3 is one site; no other site was counted.

## Where the fix sits

Upstream, in Plan: a link with paragraph text around it belongs to that paragraph's rich text, not to a
Link prop of its own. Held with the wrong-slot work until after 16 October.
