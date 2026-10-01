# Renders show the model's defaults, not the page's values

> **Package:** `@webiny/api-component-extraction` (`ComponentRenderService`), `@webiny/sdk-nextjs`
> (`ComponentSandbox`)
> **Severity:** medium — not a user-facing defect. It is an **evidence caveat** on
> `plans/component-extraction-visual-fidelity-report.md`: the report's conclusions about **text,
> type and layout are well supported, and its conclusions about imagery rest on weaker evidence than
> the rest**. Recorded so nobody reads the report as stronger than it is.
> **Status:** open.

## What happens

W7.7 specified rendering a component standalone **with the prop values from its cluster's
representative member** — the instance the reference crop came from. That is not what happens.

**No prop values are passed to the sandbox at all.** `RenderComponentInput.component` carries
`{ signature, name, source, css }`. The render pushes three messages into the page — the bundle, the
theme CSS, the light-mode flag — and none of them carries inputs. The sandbox places the component
through `ElementFactory`, which binds `componentManifest.defaults?.inputs`: **the defaults the model
wrote**, not anything observed from the page.

## Why the text and layout evidence still holds

The model copies the representative's text into its defaults, so in practice the two nearly coincide:

- **287 of 303 (95%)** of representative texts appear verbatim in the generated source
- all of them do in **26 of 32** components that have any

So the renders show the page's words in the component's layout, and every finding about text volume,
type scale, spacing and proportion is measured on the right thing.

## Why the image evidence is weaker

For images the two cannot coincide. No Image prop anywhere carries an observed value
(`image-values-are-captured-and-never-derived`), so there is nothing a correctly-wired render could
have passed. What the renders show instead is the stock URLs the model invented.

The consequence for the report: **"the customer's photography is gone" is established from the Plan
contract and the generated source, not from the renders.** The renders illustrate it. They cannot
independently confirm it, because a render that passed the representative's values would still have
had no image values to pass.

A second, smaller gap: `ElementFactory` returns early for a list of objects
(`isObject && isList → return`), so an object-list prop is bound only when the model wrote a
`defaults.inputs` entry for it. Where it did not — 2424 Tulane's _Specials Section_ — the component
renders with that input undefined.

## What would close it

Passing the representative member's derived props into the sandbox alongside the bundle. That is only
worth doing after `image-values-are-captured-and-never-derived`, because until then the values it
would pass are the ones that are already empty.
