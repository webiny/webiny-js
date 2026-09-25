# The browser bundler drops everything outside the default export, producing bundles that throw at render

> **Package:** `@webiny/remote-components`
> **Severity:** high — it affects every user of the component editor today, it is silent until a
> component renders on a page, and the stored bundle looks valid in every way anyone can check.

> **Status: fixed in W2.** Both bundlers now share one derivation
> (`packages/remote-components/src/shared/bundler/deriveComponentBundle.ts`), and the conformance
> test in `conformance.test.ts` carries a fixture for this case. Kept for the record of what the
> defect was and how it was measured.

## Summary

`bundleComponentInBrowser` builds the component body by slicing **only the `export default function`
node** out of the source by AST position
(`packages/remote-components/src/admin/bundler/browserBundler.ts:336`):

```ts
const componentBody = source
  .slice(exportDefault.start, exportDefault.end)
  .replace(/export\s+default\s+function/, "function");
```

Anything else at module scope — constants, helper components, utility functions — is discarded. The
component still references those names, so the bundle is emitted with unresolved identifiers and
throws the first time it renders.

The server-side bundler does not have this bug. It keeps the whole source minus the manifest export
(`packages/remote-components/src/api/bundler/bundleComponent.ts:60-62`) — but only when the manifest
is the last thing in the file. Its strip pattern is anchored to end-of-string, so a manifest-first
source deletes the component instead; see
[`remote-components-manifest-strip-deletes-component-when-manifest-is-first.md`](./remote-components-manifest-strip-deletes-component-when-manifest-is-first.md).

## It fails silently, which is the worst part

Reproduced end to end against the real esbuild, with the browser path's exact derivation and wrapper:

```
esbuild build: SUCCEEDED (1559 chars), errors: 0, warnings: 0
bundle still references FEATURES:    true
bundle still references FeatureItem: true
bundle DEFINES them:                 false

render: THREW -> ReferenceError: FEATURES is not defined
```

Every checkpoint before render passes:

- esbuild reports **no errors and no warnings** — `platform: "neutral"` treats unresolved identifiers
  as globals rather than failing
- the bundle is written to `bundledJs` with a valid `bundledJsSha256`
- the editor reports a successful bundle
- nothing in the entry distinguishes this component from a correct one

The failure surfaces only when the component is rendered on a page, as a `ReferenceError` naming a
symbol the author can see perfectly well in their source.

## Reproduction

Any component whose source has module-level code outside the default export. Minimal case:

```jsx
const FEATURES = ["fast", "safe", "cheap"];

function FeatureItem({ label }) {
  return <li>{label}</li>;
}

export default function Features({ title }) {
  return (
    <section>
      <h2>{title}</h2>
      <ul>
        {FEATURES.map(f => (
          <FeatureItem key={f} label={f} />
        ))}
      </ul>
    </section>
  );
}

export const manifest = { name: "Features", label: "Features", inputs: [] };
```

Open it in the component editor, let it bundle, render it. `ReferenceError: FEATURES is not defined`.

Comparing the two bundlers' body derivations on that source:

```
const FEATURES         server: kept   browser: DROPPED
function FeatureItem   server: kept   browser: DROPPED
function Features      server: kept   browser: kept
```

## Scope

Every component bundled through the editor — which is **all of them**, because the server-side path
exists but nothing calls it (`BUNDLE_REMOTE_COMPONENT` is declared in
`admin/features/shared/graphql.ts:130` and never imported).

Components written as a single self-contained function are unaffected. Helper components and
module-level constants are ordinary React authoring style, so the question is what proportion of real
components use them.

**Measured: 6 of 32 — nearly one in five.** Every component the extraction pipeline generated across
four customer sites (parkcityplace 7, 71westland 8, freehill 6, 2424tulane 11) was parsed and checked
for code at module scope outside the default export:

|                                        |             |
| -------------------------------------- | ----------- |
| components examined                    | 32          |
| with module-level helpers or constants | **6 (19%)** |
| with `import` or `require`             | 0           |
| parsing with the JSX plugin alone      | 32/32       |

So this is not a corner case reachable by unusual authoring. On generated components — the population
this pipeline exists to produce — it breaks close to a fifth of them, silently, and nothing warns
anyone. For hand-written components the rate depends on house style, but there is no reason to think
it is lower.

## Related, but file separately

The browser path also **skips `validateComponentSource` entirely** — `browserBundler.ts` never imports
it — so the guards that reject `import`/`require` and missing exports do not run on the path everyone
uses. Worth its own look; it is a different failure from this one.

## Fix shape

Either:

1. **Take the whole module** the way the server does, minus the manifest export — the smaller change,
   and it matches the behaviour components are presumably written against.
2. **Adopt one bundler.** This is the direction already recommended in
   `plans/server-side-component-bundling-investigation.md`: one implementation both the editor and the
   pipeline call, with a conformance test that bundles the same fixtures through both paths and asserts
   byte-identical output. That test is what would have caught this.

Filed separately from that work deliberately. This bug is live for existing users now, independent of
whether server-side bundling ever ships, and it should be visible on its own rather than as a line item
inside a migration.

## How it was found

While investigating server-side bundling. The two implementations were compared by applying each one's
body-derivation logic to the same source; the runtime consequence was then confirmed by running the
real esbuild over the browser path's wrapper and executing the result the way
`ComponentsSdk.hydrateComponent` does.
