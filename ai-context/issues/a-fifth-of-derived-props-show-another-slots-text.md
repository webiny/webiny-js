# A fifth of derived props show the text of a different slot

> **Package:** `@webiny/api-page-composition-poc` (`deriveInstanceProps`)
> **Severity:** high — 29 of 134 component instances across the four sites carry at least one prop
> whose value belongs to a different part of their own section. Visible on 24 of 31 composed pages.
> Not a rendering fault: every one of these pages renders cleanly and reads plausibly.

## What happens

Each placed component's text props are derived by **counting text runs**. The cluster's
representative section is walked in document order, the prop's model-proposed sample is located in
that list at index _i_, and the value bound to this page is whatever sits at index _i_ of **this**
page's section.

That holds only while index _i_ means the same thing in both sections. Where it does not, the prop
is bound to a real string, from the right page, in the wrong slot — so nothing downstream can tell
it apart from a correct value.

On 2424tulane `/apartments/la/new-orleans/contact-us`:

```
2424Tulane/Image Gallery Section    heading = "Contact Us"
```

The representative for that component has two text runs — `h2 "Take in the Sights"` and
`h2>span "Your Future Looks Bright"`. The contact page's section has eight, beginning
`h1>span "Contact Us"`. Index 0 in one is a section heading; index 0 in the other is the page title.

On parkcityplace `/apartments/ct/bridgeport/contact-us` the same mechanism shifts a whole form by
two, because that page's section opens with two buttons the representative does not have:

```
ParkcityPalace/Contact Form (3)  privacyText       = "Message (250 character limit)"   (should be the privacy sentence)
ParkcityPalace/Contact Form (3)  requiredFieldNote = "privacy policy"                  (should be "* Required Field")
ParkcityPalace/Contact Form (3)  heading           = "Contact Us"                      (that section has no heading)
```

## How widespread

Measured by deriving every prop a second way and comparing. The second derivation aligns the two
sections' text runs by **role** — a longest-common-subsequence over the tag each run sits in, with
`h1`–`h6` collapsed to one role and `span`/`strong`/`em` to another — so it survives an insertion
where counting does not, and never compares the two pages' words.

| site          | instances | derived props | instances with a wrong prop | props wrong |
| ------------- | --------- | ------------- | --------------------------- | ----------- |
| parkcityplace | 38        | 53            | 8                           | 16          |
| 2424tulane    | 71        | 117           | 14                          | 15          |
| 71westland    | 44        | 103           | 6                           | 16          |
| freehill      | 8         | 23            | 1                           | 5           |
| **total**     | **161**   | **296**       | **29**                      | **52**      |

- **29 of 134** instances that derived anything carry at least one wrong prop — **22%**.
- **52 of 296** derived props are wrong — **18%**. Of those, 12 took another run's text and 40 took
  text for a slot the section does not have at all.
- Pages with at least one wrong prop: parkcityplace 7/8, 2424tulane 10/11, 71westland 6/10,
  freehill 1/2.

It is not uniform, and the split is the useful part:

```
  9 wrong / 13   ParkcityPalace/Contact Form (3)              {heading, privacyText, requiredFieldNote}
  8 wrong / 15   71WestlandApartments/Hero Intro Section       {heading, headingHighlight, communityTitle, …}
  8 wrong / 22   71WestlandApartments/Explore Fenway Forward Intro  {heading, description}
  7 wrong / 14   ParkcityPalace/Accessibility Statement        {subheading, introText, complianceText, supportText}
  7 wrong / 35   2424Tulane/Intro/About with Stats             {body, heading}
  5 wrong / 21   2424Tulane/Location Description               {description, heading}
  5 wrong / 13   FreehillStreetLofts/Contact Form with Map View {heading, requiredFieldNote, …}
  3 wrong /  6   2424Tulane/Image Gallery Section              {heading}
  0 wrong / 40   71WestlandApartments/Footer with contact info and office hours
  0 wrong / 33   2424Tulane/Footer with contact info and office hours (2)
  0 wrong / 16   ParkcityPalace/Property Description (4)
  0 wrong / 11   2424Tulane/Specials Section (2)
  0 wrong / 10   71WestlandApartments/Site Navigation Header
```

Components that render identically on every page — footers, navigation, specials — are **flawless**:
40 of 40, 33 of 33, 10 of 10. Components reused across sections that genuinely differ carry nearly
all the error. The failure is not random; it tracks exactly how much a section varies between pages.

## The comment predicted this

`deriveInstanceProps.ts:56` already says so, and named the mechanism before it was measured:

> PROOF OF CONCEPT, and the single most approximate thing this package does. […] Aligning by
> position is deterministic and explainable, and it degrades to Assemble's current behaviour (the
> cluster sample) rather than to an empty page — **but a section whose text runs differ in number or
> order between pages will mis-align**, and the caller logs every fallback so the demo never silently
> claims per-page fidelity it does not have.

Both halves of the prediction, measured across 161 instances:

- text runs differ in **number**: 53 of 161 instances (33%)
- text runs differ in **order** — the role alignment had to shift: 33 of 161 (20%)

"The single most approximate thing this package does" was correct, and it stayed correct while three
rounds of fidelity work happened around it.

## What the comment got wrong is the more serious half

The sentence ends with a safety net: _"the caller logs every fallback so the demo never silently
claims per-page fidelity it does not have."_

**There is no such log.** `DerivedProp.source` is set to `"instance"` or `"cluster"`, and its own
doc comment says _"Every one of these is a discard-log entry"_ — but nothing reads it. The only
consumer is:

```ts
for (const prop of derived) {
  if (component.scalarInputs.has(prop.name)) {
    inputs[prop.name] = prop.value;
  }
}
```

`source` is produced, typed, documented and discarded.

And even if it were logged, it would cover the wrong cases. A `"cluster"` fallback is alignment
**admitting it found nothing**. Every failure counted above is alignment **believing it succeeded**:
it located the sample, read a run at that index, and bound a real string. Those are precisely the
ones a fallback log cannot contain. The mitigation named in the comment is both unimplemented and
pointed away from the defect.

## What this is not

Two things on the same contact page look identical and are not:

```
2424Tulane/Image Gallery Section    heading = "Contact Us"      ← this defect
2424Tulane/Location Description     heading = "Contact Us"      ← NOT this defect
```

`Location Description`'s section really does contain "Contact Us" as its own heading-role run: the
role alignment agrees with the positional read. Two sections share the page's `h1` because their
**segment boxes overlap it**. Fixing alignment fixes the first and leaves the second exactly as it
is. Worth separating before anyone measures a fix by whether that page stops saying "Contact Us"
twice.

## Why it survived this long

Every signal the PoC computes reads healthy on these pages. Text-preservation passes, because the
text _is_ on the page — in the wrong slot. Link and image reconciliation pass. The comparison
harness shows a page that looks right at a glance. A bound value that is real text from the right
page is invisible to every check that asks whether text survived, and none of them asks whether it
landed where it belongs.

## Fix directions (not decided)

1. **Align by role, not by index.** The measurement above is a working implementation — LCS over run
   roles. It is deterministic and explainable, which is what the positional approach was chosen for,
   and it handles insertion and deletion. It does not fix a section that lacks the slot entirely.
2. **Record which run a prop came from at Plan time**, removing the guess. The comment names this as
   the root cause: _"nothing records which text run a given prop came from"_. Largest change, and the
   only one that makes the link authoritative rather than reconstructed.
3. **Implement the log the comment already promises, and widen it** — emit a discard entry when a
   prop is derived from a section whose run sequence does not align cleanly, not only when it falls
   back. That does not fix anything; it stops the demo claiming fidelity it does not have, which is
   what the comment says was intended.

Whatever is chosen, `DerivedProp.source` should either gain its consumer or go.

## Reproducing

The numbers come from an instrumented composition (`alignmentAudit.ts`, removed after measurement):
it ran both derivations for every placed instance and wrote the verdicts into the page map. A first
version of that audit keyed on the full tag chain and over-reported — a home page's `h1` against an
interior `h2` scored as a mis-alignment although the positional read had returned the right heading.
The role collapse above is what separates a level difference from a role difference; any re-run
should keep it.
