# A file input's value is read bare, and nothing checks it

> **Package:** `@webiny/api-component-extraction` (Generate)
> **Severity:** high — **8 of the 35 generated components that declare a file input** emit a URL that
> cannot load. All four validators pass on every one of them.
> **Status:** open. Found reading the Generate cards for Park city Palace.

## What happens

A `createFileInput` value is an object, `{ url }`. The generated code sometimes reads it bare:

```jsx
// Park city Palace, Hero Banner — the defaults hold src: { url: "https://…" }
style={{ backgroundImage: `url(${img && img.src ? img.src : ""})` }}
```

`img.src` is `{ url: … }`, so the template literal stringifies it to `[object Object]`, the browser
requests `url([object Object])`, and nothing loads. The section's `background-color` shows through
instead — in this case `var(--wby-color-surface-overlay, #363f54)`, so a photographic hero renders as
a flat navy block.

## It is not a missing instruction

**The same model, in the same run, gets it right elsewhere.** Property Description filters on
`img && img.src && img.src.url` and renders `<img src={imageList[0].src.url}>`. 2424 Tulane's _Image
Gallery_ goes further and writes a helper that defends against the shape explicitly:

```js
if (img.src && typeof img.src === "object" && img.src.url) return img.src.url;
```

So the shape is known to the model and satisfied inconsistently. That makes it an unchecked contract,
not a prompt gap — the remedy is a check, with a prompt line as the cheaper half.

## Nothing catches it

Bundling succeeds. Text preservation passes — the text is all there. Contract conformance passes —
the props are correct. Token binding passes — the colours are variables. **A broken image URL is
invisible to all four**, and the component is recorded `ok: true` with a render to match.

## Scale, with exposure as the denominator

Only a component that declares a file input can get its shape wrong, so that is the denominator.

| site | components | declare a file input | every URL resolves | **a URL that cannot** |
| --- | ---: | ---: | ---: | ---: |
| Park city (current) | 8 | 6 | 4 | **2** |
| Park city (demo) | 10 | 7 | 5 | **2** |
| 2424 Tulane | 23 | 13 | 11 | **2** |
| 71 Westland | 9 | 4 | 3 | **1** |
| Freehill | 6 | 5 | 4 | **1** |
| **total** | **56** | **35** | **27** | **8** |

Every site is affected, and a Hero Banner is among them on three of the five.

## Two corrections this measure needed

Both were caught by reading the flagged lines rather than trusting the count, and both are recorded
because each produced a confident wrong number first.

1. **Classifying by field name.** A `createFileInput` with `list: true` yields an array of file
   objects, so the correct read is `item.url`, not `items.FIELD.url`. Tulane's _Social Media Links_
   maps `socialIcons` and reads `icon.url` correctly; the name-based check filed it as "never read".
2. **Classifying by the consuming line alone.** Most components bind the URL first — `const imageUrl
   = image.src.url` — and use the local in the JSX. Checking only the consuming line called every one
   of those broken and reported 17. One hop of variable resolution brought it to 10, and reading the
   last two showed both were sound: one reads `backgroundImage.url` directly, the other resolves the
   shape inside a helper function the hop could not follow.

## What a validator would take

The render path already loads the component in a real browser, so this is observable without a model.
`ComponentRenderService` navigates the sandbox and the provider already collects `pageErrors` — which
is how the font-stylesheet MIME warnings reach `RenderRecord`. A failed image request is the same
class of signal.

Three options, cheapest first:

- **Count failed image requests during the render.** Puppeteer's `requestfailed`, or
  `performance.getEntriesByType("resource")` filtered to `initiatorType: "img"/"css"` with
  `transferSize === 0`, read in the same evaluate that already measures geometry. Needs the render to
  have run, so it is a post-render check rather than a generation-time one.
- **Scan the rendered DOM for `[object Object]`.** One string, unambiguous, and it catches the
  failure at its source rather than at its symptom. It cannot see a URL that is well formed and 404s.
- **Static check on the generated source.** Cheapest and runs before the render, but it is the thing
  that just took two corrections to measure offline, so it would need the same care — and a helper
  function defeats a one-hop check.

**This clears the bar the colour validator did not.** The line drawn there was that a validator must
separate real defects from benign cases without a measure that cannot do it: alignment had 17 benign
undeclared cases and no way to tell them apart, so no validator. Here an image that does not load is
as unambiguous as a hex written where a variable was given. The honest caveat is that the first two
options need the render, so the check belongs with the render record rather than in the generation
retry loop — which means it reports rather than triggers a retry, unless Generate is made to wait on
a render it does not currently wait on.
