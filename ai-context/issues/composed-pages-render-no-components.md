# Composed pages render no components: the page names them one way, the bundles another

> **Package:** `@webiny/api-component-extraction` (Promote), `@webiny/remote-components`
> **Severity:** **high** — every composed page renders blank. Nothing about a migration is visible to
> anyone, and the whole visual half of the demo is unreachable.

## The symptom

Opened in the local website app, every composed page renders 900px tall with **0 images, 0 text and 0
sections**, and the console warns `Unknown component: …` once per element:

| site          | page                                      | components referenced | unknown |
| ------------- | ----------------------------------------- | --------------------- | ------- |
| parkcityplace | `/apartments/ct/bridgeport/floor-plans`   | 4                     | 4       |
| 2424tulane    | `/apartments/la/new-orleans/neighborhood` | 7                     | 6       |
| 71westland    | `/apartments/ma/boston/contact`           | 5                     | 5       |
| freehill      | `/apartments/tx/houston/privacy-policy`   | 3                     | 3       |

## What it is not

Each of these was checked and ruled out, because each is the obvious suspect:

- **Not promotion.** The Library holds **199 components, all `bundled`**, no bundle errors.
- **Not a missing component.** All 33 names the pages reference are in the Library. Zero missing.
- **Not permissions.** The website app's own API key lists all 199. So does no auth at all.
- **Not the fetch.** The server payload carries `__remoteComponent__` 200 times and 1.61 MB of
  `bundledJs`: the components reach the client.
- **Not hydration.** Hydration succeeds — the hydrated CSS is in the page, 3,701 occurrences of the
  scoped class `rc-2424tulane-…`.
- **Not an SDK version mismatch.** This was the first hypothesis and it was wrong. The app resolves
  `@webiny/*` through `NODE_PATH` to this repo's own `packages/*/dist`, and that build exports every
  factory the bundles destructure (`createTextInput`, `createLexicalInput`, `createObjectInput`, …).
  Every component reports `sdkVersion: "1"`, which is what the runtime passes.

## What it is

**The name a page references and the name a bundle registers itself under are different strings, for
199 of 199 components.**

The registry is keyed by the bundle's own manifest name (`ComponentRegistry.register`):

```ts
const name = component.manifest.name;
```

and the resolver looks up the name the page document carries (`ComponentResolver.resolve`):

```ts
const componentName = element.component.name;
const blueprint = this.components.get(componentName);
if (!blueprint) {
  logger.warn(`Unknown component: ${componentName}`);
  return null;
}
```

Those two never agree:

| the page and Library say                                   | the bundle registers as           |
| ---------------------------------------------------------- | --------------------------------- |
| `2424Tulane/FAQ Section`                                   | `Custom/FaqSection`               |
| `2424Tulane/Location Description`                          | `Custom/LocationDescription`      |
| `2424Tulane/Footer with contact info and office hours (2)` | `Custom/Footer`                   |
| `2424Tulane/Neighborhood/Location Highlight`               | `Neighborhood/Location Highlight` |
| `2424Tulane/Hero Banner (4)`                               | `Custom/HeroBanner`               |

**199 of 199 differ. Zero match.** Promote registers a component in the Library under a composed
display name — site prefix, human-readable label, a `(n)` suffix where a name repeats — while the
bundle keeps the name the generation model wrote into the component source, which is almost always
`Custom/SomePascalCase`. Nothing reconciles them, so no page can ever resolve any component.

## Why it went unnoticed

Every stage reports success, because every stage succeeded. Generate produced valid components,
Promote bundled and registered all 199, Assemble placed instances, compose wrote pages with correct
bindings — the image work in this same series verified 106 rewritten image bindings on those pages and
all 69 urls returning 200. The bindings are right. The page is right. The only thing wrong is that the
name on the page and the name in the registry are different strings, and nothing in the pipeline
compares them.

It is invisible from the API side, too: the fidelity signals the composition PoC reports — sections
against instances, text coverage, destination counts — are all computed from artifacts, not from a
rendered page. They read healthy on a page that renders nothing at all. That disagreement is exactly
what a visual comparison harness was being built to expose, and it found it before the harness was
written.

## Fix sketch (not implemented)

The two names have to be one name, and the choice matters:

1. **Make the bundle's manifest name the Library name at promote time.** Promote already knows the
   display name it is registering; the manifest is derived from the source by
   `buildComponentManifest`, so the name could be overridden there and stored with the bundle. This
   keeps page documents readable (`2424Tulane/FAQ Section`) and is the smaller change.
2. **Make the Library name the manifest's name.** Truthful to the artifact, but page documents then
   carry `Custom/FaqSection` for every site, which collides across sites in one tenant and reads
   badly in the editor.

Option 1 looks right. Whatever is chosen, the invariant is worth asserting where it can fail loudly:
a promoted component whose `manifest.name` differs from its record name is a component no page can
render, and that is checkable at promote time rather than discoverable by opening a browser.

Related: [the resolver cannot say what it does know](./component-resolution-failure-says-nothing-useful.md).
