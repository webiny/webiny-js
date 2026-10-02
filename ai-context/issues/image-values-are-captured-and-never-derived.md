# Image values are captured, never derived, and replaced with stock photography

> **Package:** `@webiny/api-component-extraction` (Plan prop derivation, Generate, Promote)
> **Severity:** high — 21 of 34 components across the four sites declare an Image prop; **36 Image
> props in total and not one carries a value**. The model fills the gap itself: **12 components ship
> 27 hardcoded `images.unsplash.com` URLs** in their manifest defaults, and Promote puts those in the
> customer's Library.
> **Status:** open. Diagnosed in `plans/component-extraction-visual-fidelity-report.md`.
> Independent of `a-component-must-contain-every-section-it-clusters-with` — neither blocks the other.

## What happens

Capture records every media source. `CapturedNode` carries it and says why:

```ts
/** A media node's source, absolute. Present on `img`/`source`/`video`/`iframe`/`embed` only. */
src?: string;
/** An image's alternative text. Present when the element carries a non-empty `alt`. */
alt?: string;
```

**Nothing downstream reads either.** Prop derivation runs over text runs — `collectSectionRuns`
returns `{ text, tag }` — so an Image prop is proposed by the model from the reference crop and then
has nothing to fill it. Across the four sites, `grep` for `.src` or `alt` in
`features/stages/plan/` returns nothing.

The result in the Plan contract, every site:

```
Site Navigation Header.logo      type=Image    observedValues=[]
Hero Banner.images               type=Image[]  observedValues=[]
Property Description.images      type=Image[]  observedValues=[]
```

|                                              | count    |
| -------------------------------------------- | -------- |
| components declaring at least one Image prop | 21 of 34 |
| Image props in total                         | 36       |
| **Image props carrying an observed value**   | **0**    |

## What the model does with the gap

It invents the content. The generated manifest carries a `defaults.inputs` block, and for image
fields the model writes third-party stock URLs:

```js
defaults: {
    inputs: {
        items: [
            { heading: "Floor Plans",   image: { src: "https://images.unsplash.com/photo-1540518614846-…", alt: "Bedroom with upholstered headboard" }, … },
            { heading: "Amenities",     image: { src: "https://images.unsplash.com/photo-1540497077202-…", alt: "Woman using gym equipment" }, … },
            { heading: "Neighborhood",  image: { src: "https://images.unsplash.com/photo-1542838132-…",   alt: "Person carrying a basket of fresh produce" }, … }
        ]
    }
}
```

**12 of 34 components, 27 URLs, all `images.unsplash.com`.** They are what the Generate view's render
shows, and they are what **Promote writes into the Library** as the component's defaults. A customer
who places the component gets stock photography unless and until they replace every image by hand.

## What a customer sees

Park city Palace's footer loses the Connecticut Housing Partners logo, the equal-housing and
accessibility icons and the W3C WCAG badge — and the whole vertical band they occupied, which is most
of why it renders at 193px against the source's 460px.

Freehill's hero replaces the property's own pool and building with a stock modern villa. Two things
travel with that substitution: the source's **dark scrim over the hero image is absent**, so white
heading text sits on a bright photo and legibility drops; and the text column is wider than the
source's, so a deliberately balanced two-line heading re-breaks in the wrong place.

The images are the first thing anyone looks at on these pages. This is the difference a customer
notices before any of the others.

## Why it was invisible

Nothing checks it. The three validators are text preservation, contract conformance and token
binding. A component with an Image prop and no value passes all three, and the Generate view drew a
visual-similarity score that gave Park city Palace's image-less footer **0.97** — the highest on its
site (see `the-similarity-score-rewarded-the-failures-it-should-have-caught`).

## Scope note

The data exists at capture and is dropped before Plan. This is a pipeline gap, not a model one — the
fix is derivation, not prompting.

---

## Scope, settled by measurement

The fix covers **images, links and list items in one traversal**, not images alone. The measurement
that decided it:

**An images-only fix reclaims zero of the 120 texts** that the union-text narrowing left without a
prop (`a-component-must-contain-every-section-it-clusters-with`). `sectionDigest` builds a member's
`texts` from `textRuns`/`text` only — **`alt` is an attribute and never enters the digest** — so no
amount of image-value derivation can put a text into a prop. Images are not where the text is.

Links are. The 92 empty list/non-scalar props across the four sites:

| type                                                                                                        | count  |
| ----------------------------------------------------------------------------------------------------------- | ------ |
| `Link` 27 + `Link[]` 14                                                                                     | **41** |
| `image` 18 + `Image` 9 + `Image[]` 6                                                                        | 33     |
| `Point` 3 + `Point[]` 7                                                                                     | 10     |
| `FormField[]`, `FilterField[]`, `FaqItem[]`, `Block[]`, `FeatureSection[]`, `FloorPlanResult[]`, `object[]` | 8      |

Links outnumber images and carry labels, which is text. Splitting the work by value type would mean
two passes over one traversal and would leave the larger half undone.

### A correction worth recognising as its own class

The first version of this scoping said 23 of the 120 sat behind image-typed props and could be
reclaimed by fixing images. **The 23 was accurate and the implication was false.** Those texts are in
components whose only _empty_ props happen to be image-typed; the texts themselves are ordinary copy
that image derivation cannot touch. The number was right, the causal relationship it suggested was
not there.

That is a harder failure to catch than a wrong number, because checking the arithmetic confirms it.
It was caught by asking what an image prop can actually hold, which is a question about the mechanism
rather than the count. The same shape is worth watching for wherever a measurement is grouped by one
attribute and then read as if that attribute caused the grouping.

## Sequencing against file migration

Deriving the real URLs and migrating the files are **sequential, not alternatives**.

This pass derives the values the page actually used, which stops the model inventing stock
photography. Those values are the source site's own URLs — and per `page-images-are-never-migrated`,
**72% of file-typed bindings point at the previous marketing vendor's Cloudinary**, not at the
customer's own infrastructure. So a component with derived values is strictly better than one with
Unsplash defaults (it shows the right photograph) and still leaves the migrated site depending on
infrastructure the customer is leaving.

Migration is filed separately, and its own sequencing note already says binding comes first:
migrating assets perfectly while images bind in a shape that does not render would change nothing a
visitor sees.

---

## Fixed

One traversal of each member's section now fills the non-text props: a list prop takes one repeated
subtree per item, a scalar prop takes the next value of its kind in document order, and values are
merged and deduped across members. `observedValues` stays `string[]` and whatever a bound value
carries as text joins it, so the prompt, the text-preservation validator and the coverage check all
see these values without learning a new type. Generate is given the values and told to use them as
the manifest defaults.

Re-ran Plan → Generate → render on all four sites.

|                                                | before       | after        |
| ---------------------------------------------- | ------------ | ------------ |
| image props carrying a value                   | **0 of 36**  | **21 of 36** |
| empty list/non-scalar props                    | 92           | 41           |
| **components shipping invented Unsplash URLs** | **12 of 34** | **0 of 34**  |
| invented URLs in generated source              | 27           | **0**        |

Freehill's hero now renders the property's own building — a different slide of the site's own
carousel, because the binder observed all four — where before it rendered a stock villa.

What was derived: 204 list items carrying 214 text fields, 47 link fields and 29 media fields, plus
21 scalar link values and 30 scalar media values.

### Reclaim of the union-text cost, split

Of the 312 texts the union-text narrowing removed from the prompt, 162 are now held by a prop, up
from 79 — **83 reclaimed**, leaving 150 not held (from 233).

| what holds it                       | count |
| ----------------------------------- | ----- |
| list items                          | 105   |
| image alt                           | 7     |
| link values                         | 2     |
| not attributable to a derived value | 48    |

**Links against list items is not the clean split it looked like.** `Link[]` is the commonest prop
type bound as a list (12 of the list-bound props), so a list of links is counted under list items —
the 47 link fields inside those items are link work appearing in the other column. The 48
unattributable are the honest residue: Plan is model-backed, and a re-plan can cover a text by
proposing a different prop, which is not this change's doing.

Per site, removed → still not held: Park city Palace 63 → 38, 2424 Tulane 129 → 61, 71 Westland
108 → 49, Freehill 12 → 2.

### Two faults found on the way, both of which reported success

**The first version bound nothing at all.** It read the segment artifact from `context.upstream`,
which holds only the IMMEDIATELY previous stage's artifacts — for Plan that is Classify's, so
`upstream.sections` was always undefined. The handler was written to carry on without the sections so
a missing artifact would not fail a stage that can still produce a contract; that is the right
behaviour and it was set to the wrong volume, so a complete no-op passed as a success. Measured 0 of
11 image props bound on the first site before anyone looked. Both the missing artifact and an
unresolvable section node are now logged as errors.

**The second version bound only the reference section**, and reclaimed 28 of the 233 — close to its
ceiling, because those 233 are by definition the texts that are NOT in the representative. Another
page's navigation labels are not in this page's navigation. `observedValues` has always meant "values
observed across the cluster's members", and the binding now matches the field's own definition.
