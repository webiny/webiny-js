# The server bundler's manifest codegen emits unparsable code for any nested input

> **Package:** `@webiny/remote-components`
> **Severity:** high — measured at **112 of 118 stored components (95%)**. The server bundling path
> has never worked for them. Pre-existing: the old esbuild-wasm Node build fails identically.

> **Status: fixed in W2.** Both bundlers now share one derivation
> (`packages/remote-components/src/shared/bundler/deriveComponentBundle.ts`), and the conformance
> test in `conformance.test.ts` carries a fixture for this case. Kept for the record of what the
> defect was and how it was measured.

## Summary

`buildManifestCode` rewrites each manifest input entry into a factory call
(`packages/remote-components/src/api/bundler/bundleComponent.ts`):

```ts
const inputEntryPattern =
  /\{\s*name\s*:\s*["'`](\w+)["'`]\s*,\s*factory\s*:\s*["'`](create\w+)["'`]\s*,\s*params\s*:\s*(\{[^}]*\})\s*\}/g;
```

`params` is captured as `\{[^}]*\}` — a character class that cannot cross a `}`. So the pattern only
matches an input whose `params` object is **flat**.

The moment `params` contains a nested object — which is every `createObjectInput`, every list input,
and anything with nested `fields` — the outer entry cannot match. The regex then matches from
somewhere inside the nested structure instead, and splices a closing `)` onto text that still
carries the outer `name:` / `factory:` / `params:` keys:

```js
{ name: "label", factory: "createTextInput", params: { label: "Label", defaultValue: "Floor Plans" }),
```

That is not valid JavaScript, and esbuild says so:

```
<stdin>:160:120: ERROR: Expected "}" but found ")"
```

## Measured across every stored component

Read-only pass: every component's stored source pulled from the deployed API and run through the
server bundler locally. Nothing written.

|                | Count   |
| -------------- | ------- |
| Components     | 118     |
| Bundle cleanly | **6**   |
| Fail to bundle | **112** |

Failures by message:

| Count | Message                             |
| ----- | ----------------------------------- |
| 111   | `ERROR: Expected "}" but found ")"` |
| 1     | `ERROR: Unexpected "export"`        |

So it is not an edge case. Flat-params components are the edge case.

## It is not caused by the esbuild swap

The same wrapped source was fed to both esbuild builds with identical options:

| esbuild build                                               | Result                                               |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| Node build (`esbuild-wasm`, the old server path)            | `<stdin>:160:120: ERROR: Expected "}" but found ")"` |
| Browser build (`esbuild-wasm/esm/browser.js`, the new path) | same error, same position                            |

Both are esbuild 0.28.2 and the derivation is byte-identical between them. The failure is a property
of the generated source, not of which binary parses it.

## Why nobody noticed

The component editor bundles in the browser, by a different derivation
([`remote-components-browser-bundler-drops-module-scope.md`](./remote-components-browser-bundler-drops-module-scope.md)),
so the editor path never exercises this code. The server path is what the extraction pipeline needs
in order to promote a component without a human opening the editor — which is the thing that has not
worked.

## Fix sketch (not implemented)

Stop deriving the manifest with regular expressions. The manifest is already a parsed object literal
by the time it is needed; walk it and emit the factory calls from the parsed form, so nesting is
structural rather than something a character class has to survive.

The conformance test in W2 should carry a nested-object-input fixture and a list-input fixture, both
of which fail today.
