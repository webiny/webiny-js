# Text preservation was checked against a component's source code, not against what it renders

> **Package:** `@webiny/api-component-extraction`
> **Severity:** was **high** — it is the largest fidelity loss in a clean run and it is
> customer-visible. A skipped component is not promoted, so every instance of it across every page
> goes unplaced.

> **Status: fixed.** The check now reads the component rendered with its values. Kept as the record
> of what it was measuring and how that was established.

## The defect

```ts
validateTextPreservation(planned.sourceTexts, output.source);
```

It compared the page's captured text against **the component's generated source code as a string**.
No prop values applied, no rendering.

A correctly parameterised component does not contain the page's text — the text arrives as a prop. So
correct parameterisation read as text loss, by construction.

The clearest case: thevibe's contact component declares `officeHours: { day, hours }[]` and renders
it with a `dayNames` table. The captured text node is `"Monday: 9:00AM to 6:00PM"`; the component
splits it into the two fields it should be split into, so that string appears nowhere in the code.
An exemplary component, skipped for being well built, taking all of its instances with it.

## Measured attribution

Every failing fragment across five stored runs, attributed:

|                         | Fragments | Share  |
| ----------------------- | --------- | ------ |
| Text lives in props     | 14        | 41%    |
| Present but transformed | 13        | 38%    |
| Cluster variation       | 4         | 12%    |
| **Genuinely dropped**   | **3**     | **9%** |
| Non-content text        | 0         | 0%     |

**3 of 34.** The gate was mostly skipping components that had done the right thing. A further 20 of
34 were explicable by prop values, so the first row understates.

## Two extraction defects behind it

**Fragments the page never displayed.** `directText` concatenates an element's direct text children,
skipping any inline element between them. `<p>By submitting this form, you agree to the <a>privacy
policy</a>.</p>` yields `"By submitting this form, you agree to the ."` — with a stray space and
period, a string no page shows and no component can contain. It appeared on three sites. The capture
evaluator now keeps the runs (`textRuns`) and the section digest builds fragments from them.

**Non-content text.** Icon-font ligatures (`keyboard_arrow_down`, `attach_money`) and bare glyphs are
text nodes but not content. They are now excluded, by a rule deliberately narrower than the obvious
one: a lowercase token **containing an underscore**, or a fragment with neither letter nor digit. The
wider rule — any single all-lowercase token — was measured against the five sites and would have
excluded ZIP codes (70119, 02115), years (2026), unit numbers (578, 644, 650) and the word
"downtown". It excludes 16 of 722 fragments, 2.2%, every one a comma, a bullet, an asterisk or a
Material ligature.

## The premise that was wrong

The brief proposed that the validator counting non-content text was a live cause, citing freehill's
icon ligatures. It was not: under the source-code check those ligatures **passed**, because the
component contains them literally, so they never caused a skip. They were noise in the coverage
count, not a skip cause.

**The reversal is the finding.** Under a rendered check they become a real category — an icon renders
only when its branch has data, so an unobserved icon disappears from the render while the page still
shows it. So the exclusion was worth building; the reasoning in the brief was right about the
destination and wrong about the road.

## The fix

The check reads the component **rendered with its values applied** — bundled, run in a `node:vm`
context with a stubbed SDK and real React, and rendered to static markup. A fragment passes if it is
in the rendered text, or is built entirely from values the component did render, or appears in the
source with the non-rendering regions stripped.

That last clause matters twice over:

- **A single render exercises a single branch.** Tabs, filters, empty states and rows beyond the
  observed data hold text the component will show and one render did not — "No Results Found",
  "View Amenities", the fourth day of opening hours.
- **Stripping the non-rendering regions is the point.** The old check searched the whole source, so a
  component passed by carrying the page's paragraphs inside an input's `description` — text the model
  echoed as an example and never renders. One parkcityplace component passed on 22 fragments that
  exist only in comments and descriptions.

Bundling is separated from text checking in the artifact (`validation.bundling`), because a component
that cannot be bundled would otherwise report as "missing text" for every fragment — the wrong
diagnosis and the wrong remedy. A render that _throws_ is neither: it falls back to the renderable
source, since synthesised props can fault on data a real instance would never supply.

## Result

|        | Pass rate       |
| ------ | --------------- |
| Before | 75% (48/64)     |
| After  | **88% (56/64)** |

All **3 genuine drops still fail**, which is the check that the gate still does its job.

The route there is worth recording, because the number moved the wrong way twice before it moved the
right way: building props from observations alone rendered blanks and crashed components (55%);
reading input `defaultValue` instead of `manifest.defaults.inputs` left components nearly empty
(63%); only stripping the non-rendering regions and accepting renderable source reached 88%. Each was
found by measuring, not by reasoning.
