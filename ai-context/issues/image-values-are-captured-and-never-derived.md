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
