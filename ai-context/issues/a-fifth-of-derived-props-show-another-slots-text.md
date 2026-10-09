# A fifth of derived props show the text of a different slot

> **Package:** `@webiny/api-page-composition-poc` (`deriveInstanceProps`)
> **Severity:** high — 29 of 134 component instances across the four sites carry at least one prop
> whose value belongs to a different part of their own section. Visible on 24 of 31 composed pages.
> Not a rendering fault: every one of these pages renders cleanly and reads plausibly.
> **Status:** fixed in part. Role alignment is now the derivation — see _Fixed in part_ below. The
> class that bound a prop to the wrong run is gone (12 → 0); the class where the section has no such
> slot remains (43) and is now reported rather than silent. Everything above that heading describes
> the state before the change and is kept as the record of what was measured.

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

## Fixed in part — role alignment is now the derivation

Role alignment moved from the audit into `deriveInstanceProps` as the primary match; index matching
survives only as the fallback where role alignment has nothing to offer. Every value that is not
role-matched is now reported.

Measured again on the same four sites, on the same population — props derived from the instance,
which is what the 296 counted; cluster fallbacks were outside it then and are reported separately
below.

| site          | role | position | derived | instances with a positional prop | before: wrong / instances |
| ------------- | ---- | -------- | ------- | -------------------------------- | ------------------------- |
| parkcityplace | 40   | 14       | 54      | 8                                | 16 / 8                    |
| 2424tulane    | 104  | 13       | 117     | 12                               | 15 / 14                   |
| 71westland    | 92   | 11       | 103     | 6                                | 16 / 6                    |
| freehill      | 18   | 5        | 23      | 1                                | 5 / 1                     |
| **total**     | 254  | **43**   | **297** | **27**                           | **52 / 29**               |

- **52 → 43 props**, **29 → 27 instances**.
- The **12** props bound to a _different run than the one playing their part_ are **gone** — that
  class cannot occur now, because the run playing the part is what gets bound.
- The **40 → 43** with no run in that role remain, and were never fixable by alignment: the section
  does not contain the slot. They are now `text.aligned-by-position` in the discard log, naming the
  component, the input and the value.

The named case, before and after, on parkcityplace `/apartments/ct/bridgeport/contact-us`:

```
privacyText        "Message (250 character limit)"  →  "By submitting this form, you agree to the ."
requiredFieldNote  "privacy policy"                 →  "* Required Field"
heading            "Contact Us"                     →  "Contact Us"   ← still, and now flagged
```

### Where it did not fall

```
  7  ParkcityPalace/Contact Form (3)                    {heading, privacyText}
  7  ParkcityPalace/Accessibility Statement             {subheading, introText, complianceText, supportText}
  7  2424Tulane/Intro/About with Stats                  {body, heading}
  7  71WestlandApartments/Explore Fenway Forward Intro  {heading, description}
  5  FreehillStreetLofts/Contact Form with Map View     {heading, requiredFieldNote, privacyDisclaimer, …}
  4  71WestlandApartments/Hero Intro Section            {communityTitle, introLabel, unitTypes}
  3  2424Tulane/Location Description                    {description, heading}
  3  2424Tulane/Image Gallery Section                   {heading}
```

Every one is a component whose generated interface has slots the section on that page does not fill
— a contact form asked for a heading where the page puts none, an intro asked for a label the
interior pages drop. No alignment can invent those. They are a **Plan/Generate** question: the
component was given inputs the cluster does not consistently supply. That is the next thing to look
at, and it is a different defect from this one.

### And the part that was never counted

**81** props fall through to the cluster sample — openly another page's words, on 73 instances. They
were invisible before this change and are now `text.unmatched`. They are not part of the 52 and
never were; the audit excluded them because positional alignment had already claimed a value.

## The mitigation, now wired

`DerivedProp.source` has a consumer. Anything not `role` produces a discard entry naming component,
input and value:

```
text.aligned-by-position  43
text.unmatched            81
```

Two kinds rather than one, because they fail differently to a reader and merging them would hide the
worse case behind the obvious one. A positional value is _this page's own text in a slot nothing
confirms_ — it reads as correct, and no other signal disputes it. An unmatched value is visibly from
elsewhere. Page-level counts sit on `PageSignals.textProps`, so an operator can see which pages carry
guesses before opening the log.

## Two corrections worth keeping

**The first measurement over-reported.** It keyed on the full tag chain, so a home page's `h1`
against an interior page's `h2` scored as a mis-alignment although the positional read had returned
exactly the right heading. Caught on the anchor dump before reporting; the role collapse in
`runRole` is what separates a level difference from a role difference. It took the count from 63 to
52, and the same collapse is now load-bearing in production.

**The visible symptom has two causes.** On 2424tulane's contact page:

```
2424Tulane/Image Gallery Section    heading = "Contact Us"      ← this defect
2424Tulane/Location Description     heading = "Contact Us"      ← NOT this defect
```

`Location Description`'s section really does contain "Contact Us" as its own heading-role run,
because its segment box overlaps the page `h1`. Role alignment agrees with the positional read there
and binds the same value. **That page still says "Contact Us" twice, and that is the fix working
correctly** — not a sign it failed. The remaining half is a segmentation question.

## Still open

**Record which run a prop came from at Plan time.** The original comment names the root cause —
_"nothing records which text run a given prop came from"_ — and everything here reconstructs that
link rather than reading it. Role alignment is a better reconstruction, not an authoritative one.
That change makes the 43 and the 81 answerable instead of merely visible.

## Seen again after the fixes, upstream of them (2026-10-09)

Check-job run 3 (2424 Tulane) ran after the per-copy and alignment work. Its Footer was generated four
times from one identical prompt (`reports/2026-10-09/footer-thinking-quality.md`). All four passed every
check. Two of the three long-thinking answers render text in the wrong slot: "Copyright © 2026
Copyright ©", and "Office Hours" or "2424 Tulane Apartments" among the bottom links.

**The source of it is the Plan contract, not the model and not composition.** The run's Plan records
these observed values for the Footer's link lists:

- `legalLinks`: "2424 Tulane Apartments", ",", "Office Hours";
- `socialLinks`: "2424 Tulane Apartments", "Corporate Logo", "Copyright ©", "Privacy Policy".

The model reproduces them as the lists' defaults. The one answer that rendered the bottom links
correctly (A) did so by writing "Privacy Policy" and "Accessibility Statement" into its markup and
ignoring its own list.

**So this class:**

- **is not a thinking artefact.** It appears in long-thinking answers, and the short-thinking one has
  it too;
- **is not fixed by the per-copy and alignment work.** That work derives instance values at composition
  and binds observed scalars. This is the Plan's observed values for _Link-list_ props, which reach the
  component as its defaults and so appear on every render and every instance that falls back to them;
- **passes every check.** The texts are present, so text preservation is satisfied; the props exist,
  so the contract is satisfied.

**The defect's location is upstream by default now, not by elimination.** This is the third time the
answer to "why did the model write that" has been "it was told to": after the invented images and the
spacing variables, the prompt was accurate about wrong data and the model followed it. When a generated
component shows the wrong text, look at what the Plan handed it first.

Measured (`reports/2026-10-09/link-list-observed-values.md`): 49 of 203 link-list props across 19
runs carry wrong text (15 of 55 on the five demo jobs). On composed pages it shows on Park City only (a
"Copyright ©" link in every footer of its site tenant; "Explore" on four root pages), because composition
re-derives link lists from the captured page and masks the Plan's values elsewhere. Component defaults
are not masked: renders, Library previews and fresh editor drops show them.
