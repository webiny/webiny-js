# The server bundler's manifest strip deletes the whole component when the manifest is not last

> **Package:** `@webiny/remote-components`
> **Severity:** high — the component is deleted silently, the bundle is emitted and stored as
> valid, and nothing in validation, bundling or the stored record says anything is wrong.

> **Status: fixed in W2.** Both bundlers now share one derivation
> (`packages/remote-components/src/shared/bundler/deriveComponentBundle.ts`), and the conformance
> test in `conformance.test.ts` carries a fixture for this case. Kept for the record of what the
> defect was and how it was measured.

## Summary

`wrapInFactory` removes the manifest export from the source before handing it to esbuild
(`packages/remote-components/src/api/bundler/bundleComponent.ts`):

```ts
const componentBody = source
  .replace(/export\s+default\s+function/, "function")
  .replace(/export\s+const\s+manifest\s*=\s*\{[\s\S]*?\};?\s*$/, "");
```

The second pattern is anchored with `$` and carries no `m` flag, so `$` means end of _string_, not
end of line. `[\s\S]*?` is lazy, but the anchor forces it to keep extending until it finds a `}`
followed by nothing but whitespace to EOF — the last brace in the file.

So the pattern does not delete "the manifest". It deletes **everything from `export const manifest`
to the end of the source**.

That is correct only when the manifest happens to be the last thing in the file.

## What it costs

Measured against the real derivation:

| Manifest position           | What survives the strip                     |
| --------------------------- | ------------------------------------------- |
| Last (the prompt's example) | `const clamp = …` + the component — correct |
| First                       | `""` — the entire component is gone         |

With the manifest first, the emitted bundle still looks plausible. It contains the factory, the
runtime destructure and the manifest object, and ends with
`return _createComponent(Hero, {…})` — but `Hero` was never defined. `platform: "neutral"` treats
the unresolved name as a global, so esbuild reports no error, `sha256` is computed over a
well-formed bundle, and the component is stored. It fails only when a page renders it.

## Why it is reachable

Nothing constrains where the manifest goes:

- `validateComponentSource` only checks that a manifest export exists and has a `name`
  (`MANIFEST_EXPORT_PATTERN = /export\s+const\s+manifest\s*=/`) — position is not checked.
- The generation prompt's **rule 2** says only _"The manifest MUST be a named export"_
  (`packages/remote-components/src/api/features/generateComponent/buildComponentPrompt.ts`). Its
  worked examples all place the manifest last, so the model usually complies by imitation — but
  imitation is the only thing holding it.

A model that emits the manifest first produces an empty component, and every check between
generation and render passes.

## Currently latent, measured

Across all **118** stored components, the strip leaves a component behind in **118** cases and
empties the source in **0**. Every component generated so far has imitated the prompt's manifest-last
example. So this is a trap that has not sprung, not a live failure — unlike the nested-input codegen
bug next to it, which fires on 112 of the same 118
([`remote-components-manifest-codegen-breaks-on-nested-inputs.md`](./remote-components-manifest-codegen-breaks-on-nested-inputs.md)).

118 of 118 is not a safety margin, though. The prompt requires only that the manifest be _a named
export_; manifest-last is one of several shapes that satisfy the stated rule, and the model has
simply been emitting that one. The first component that puts the manifest anywhere else loses
everything after it.

That makes this a dependency on **which of several valid model output shapes happens to be
emitted** — the same class of defect as the F1 credibility rule that covered only one of two valid
shapes. Model-backed stages produce varying shapes by nature, so nothing downstream of one may
assume a particular shape; it has to handle the set the rule actually permits. A count of 118/118
measures what the model has done so far, not what it is allowed to do.

## Relationship to the browser bundler issue

Same outcome — a stored bundle whose component body is missing — by a different mechanism. See
[`remote-components-browser-bundler-drops-module-scope.md`](./remote-components-browser-bundler-drops-module-scope.md),
which states that the server bundler "keeps the whole source minus the manifest export". That is
true only for manifest-last sources; this issue is the exception to it.

Both are exactly what a derivation conformance test is for: the two bundlers agree on nothing that
is actually checked today.

## Fix sketch (not implemented)

Strip the manifest by its parsed extent rather than by a regex to EOF — the source is already
parsed to pull `manifestSource` and the input factories out, so the range is known. Failing that,
match the manifest's own object extent by brace balance instead of anchoring to `$`.

Either way the conformance test should include a manifest-first fixture, since that is the case
every current check passes and the renderer fails.
