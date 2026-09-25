# Server-side component bundling — investigation

**Status:** investigation only. No implementation written. An implementation brief should be written
from this after review.

**Headline:** a server-side bundler already exists, already runs under plain Node, and is already
wired to a GraphQL mutation. Nothing calls it. The work is not building one — it is reconciling the
two that exist and getting a 13.3 MB wasm binary to the runtime.

---

## A. What bundling does today

### 1. Location, input and output

`packages/remote-components/src/api/bundler/bundleComponent.ts` (196 lines), exported from
`bundler/index.ts`.

- **Input** — `ComponentSource { name, source, css? }` (`bundler/types.ts`)
- **Output** — `BundledComponent { name, source, bundled, sha256, css?, cssSha256? }`

Persisted fields on `wbyRemoteComponent` (`api/domain/WbyRemoteComponentModel.ts:18–26`):

```
source, css, bundledJs, bundledCss   → fields.text().compress()
bundledJsSha256, bundledCssSha256    → fields.text()
status, sdkVersion                   → fields.text()
```

There is **no manifest field**.

### 2. The editor path

`ComponentEditorPresenter.ts:422` → `bundleComponentInBrowser`
(`admin/bundler/browserBundler.ts:326`) → `this.gateway.update(id, { bundledJs, bundledJsSha256,
bundledCss, bundledCssSha256 })` (`ComponentEditorPresenter.ts:400–405`).

The bundle is produced in the browser and written back through the ordinary update mutation.

### 3. `bundleRemoteComponent` — a mutation, and dead code

Declared at `api/graphql/RemoteComponentSchema.ts:163`, resolved at `:262` →
`BundleRemoteComponentUseCase` → the **server** `bundleComponent`, writing the same four fields.

The admin even holds the query document (`admin/features/shared/graphql.ts:130`), but
`BUNDLE_REMOTE_COMPONENT` **is never imported anywhere**. Server-side bundling is shipped and
unreachable.

### 4. Build tooling

`esbuild-wasm` on both sides, with identical `build()` options — `format: "iife"`,
`globalName: "__remoteComponent__"`, `platform: "neutral"`, `jsx: "transform"`, `bundle: true`,
`write: false`.

They differ only in initialisation:

|              | server                          | browser                                                                                       |
| ------------ | ------------------------------- | --------------------------------------------------------------------------------------------- |
| init         | `initialize({ worker: false })` | `initialize({ wasmURL: "https://unpkg.com/esbuild-wasm@0.28.1/esbuild.wasm", worker: true })` |
| wasm source  | on-disk package                 | unpkg.com                                                                                     |
| `resolveDir` | `process.cwd()`                 | `"/"`                                                                                         |

### 5. Browser-specific dependencies of the server bundler: none

It is already Node code — `node:crypto`, `node:path`, `node:url`, `process.cwd()`.

**Measured:** it runs under plain Node 24 with `typeof window === "undefined"`, no DOM, no shims.

The browser-specific implementation is the _admin_ one: WebCrypto sha256
(`admin/bundler/sha256.ts`), a wasm fetch from unpkg, and a web worker.

### 6. Bundling transforms; it does not execute

esbuild parses and transforms. Nothing `eval`s, `new Function`s, or imports the component source.
Validation additionally forbids `import` and `require` (`validateComponentSource.ts:3–4`).

The only place component code is **executed** is `ComponentsSdk.hydrateComponent` — which is the
manifest path, and is browser-only. That is the problem in section B, not a property of bundling.

---

## B. The manifest

### 7. How it is produced

`extractManifestSource` (`bundleComponent.ts:8`), `extractInputFactories` (`:16`) and
`buildManifestCode` (`:33`) — all module-private. They run at bundle time and emit the manifest as
**code embedded in the bundle**, never as data. That is precisely why the only supported way to read
it back is to execute the bundle.

### 8. Execution is not required to derive it

Proven twice over: the composition PoC derives it from stored source, and the browser bundler's
`transformManifestInputs` does the same properly via AST.

Executing the bundle is a consequence of nothing persisting the manifest — not a requirement of
producing it.

### 9. Cost of persisting it

- **A field** on `WbyRemoteComponentModel`.
- **No migration.** CMS fields are additive; an absent field reads as undefined on existing entries.
- **A backfill**, re-deriving from the stored `source`. Pure computation, no browser, milliseconds
  per component at the measured speed.

### 10. Correction to the PoC's finding — it is worse than reported

The PoC recorded that `buildManifestCode`'s regex "cannot match nested braces, so a nested object
input is left unbuilt". That is not what happens.

The regex **does** match. It truncates the `params` capture at the first inner `}` and emits
unbalanced JavaScript. Measured against the real bundler:

```
nested input   FAIL   ✘ [ERROR] Expected "}" but found ")"

  createObjectInput({ name: "cards", label: "Cards", itemShape: { title: "Text" }) }
```

So it is a **hard build failure, not a silent omission** — a component with a nested object input
cannot be bundled by the server path at all. Loud rather than quiet, which is the better failure, but
still a total one.

**Server-side bundling does not supersede it.** That regex _is_ the server path. It is superseded
only by adopting the browser bundler's AST transform.

---

## C. Where it would run

### 11. Time and memory are non-issues; bundle size is the blocker

Measured on the real built module:

|                                          |            |
| ---------------------------------------- | ---------- |
| cold (first call, includes esbuild init) | **165 ms** |
| warm, per component                      | **3–5 ms** |
| peak RSS                                 | **69 MB**  |

Against 2 GB memory and 900 s timeout, that is nothing. What does bite:

- `esbuild.wasm` is **13.3 MB**
- `Infra.Api.MaxBundleSize` is **8 MiB** (`webiny.config.tsx:67`)
- `_handler.mjs` is already **6,789,691 B = 6.47 MiB — 81% of the limit**
- **No `.wasm` ships in the API bundle today**

So the existing server mutation would fail at `initialize()` if anything called it. Server-side
bundling has never actually worked in a deployed environment.

Also observed: `fileURLToPath(import.meta.url)` is statically inlined into the deployed handler as the
developer's local absolute path (`/Users/svenalhamad/Dev/.../bundleComponent.js`). Harmless today —
it only feeds a CJS polyfill — but it is a build-time leak worth knowing about.

### 12. Task or mutation

**Either, and a mutation suffices.** Thirty components is 30 × 4 ms ≈ 120 ms plus one 165 ms init.
The task machinery is not needed for the compute; it would only buy retry semantics and progress
visibility.

### 13. Network access

- **Server path: none.** Validation forbids `import`/`require`, so `bundle: true` resolves nothing —
  no filesystem lookups, no registry, no egress.
- **Browser path: yes.** It fetches wasm from unpkg.com.

### 14. Cost per component

Measured in item 11.

---

## D. Integration

### 15. What changes in the editor

Keep a local build for **live preview** — instant, no round-trip — but have the **stored** bundle come
from the server mutation. Preview and artefact then have different jobs, which is the honest split.

### 16. Existing components — the two bundlers do not agree

This is the strongest finding. Measured on one source containing a module-level constant and a helper
component:

```
const FEATURES         server: kept   browser: DROPPED
function FeatureItem   server: kept   browser: DROPPED
function Features      server: kept   browser: kept
```

The browser slices only the default-export function by AST position; the server keeps the whole source
minus the manifest. So a browser-produced bundle for any component with helpers **references undefined
symbols at runtime**.

Meanwhile the server fails outright on nested manifest inputs, and the browser path skips
`validateComponentSource` entirely (`browserBundler.ts` never imports it).

**Each path is broken where the other is not.** Existing browser bundles are therefore not reproducible
server-side — but rebundling would _fix_ a class of them rather than regress them. Every `sha256`
changes.

### 17. Where the pipeline would invoke it

`PromoteHandler.ts:233–239` creates the component with `source`, `css`, `status: "draft"` and **no
bundle**. Unpromoted components never leave the job, so **Promote** is the natural point — bundling at
Generate would bundle work that is subsequently discarded.

### 18. What marks a component as bundled

**Nothing.** `status` is free text defaulting to `"draft"`
(`CreateRemoteComponentRepository.ts:43`) and nothing ever changes it. Readiness is implicitly
"`bundledJs` is non-empty".

---

## Feasibility assessment

**The bundler can run outside a browser as is — measured, not inferred.** The server implementation is
already Node-native, already registered, and bundles in 3–5 ms with no DOM present. Portability is not
the problem.

The real blockers, in order:

1. **Getting 13.3 MB of wasm to the Lambda** against an 8 MiB limit with the handler already at
   6.47 MiB. Options: a Lambda layer (the Chromium precedent exists in this project), fetching the wasm
   into `/tmp` on cold start (512 MB ephemeral is ample, but adds egress and cold-start cost), or a
   separate function outside the API bundle.
2. **Reconciling two divergent implementations**, neither of which is currently correct.

---

## Recommended approach

**One bundler, and it should be the server one — rebuilt on the browser one's internals.**

Concretely:

- Keep `api/bundler` as the single implementation.
- Replace its regex parsing with the acorn/AST and css-tree logic from `admin/bundler`.
- Keep the **server's** body derivation (whole source minus manifest), not the browser's — the
  browser's is the one that drops helpers.
- Delete `bundleComponentInBrowser` as a producer of stored bundles.
- Have the editor call `bundleRemoteComponent`, the mutation that already exists.

If preview latency demands a local build, the editor may keep one for **preview only** — it must never
write `bundledJs`. That is the line that keeps one answer to one question.

**Two implementations do not look unavoidable.** If preview forces a second esbuild invocation in the
browser, the two should share wrapper generation and manifest transformation as a pure module with no
Node or DOM imports, leaving only sha256 and esbuild initialisation to differ. Agreement is then
enforced by a test that bundles the same fixtures through both paths and asserts byte-identical
output — exactly the test that would have caught today's divergence.

---

## Manifest recommendation

**Same fix, same change.** The AST transform that fixes nested inputs already builds the manifest as a
structured object; persisting it is then writing what is already in hand to a new field at bundle
time. Doing it as a separate piece of work means parsing the source twice.

Recommend a `manifest` field on the model, written by the bundler, backfilled from `source` for
existing components. That closes the filed manifest issue and removes the composition PoC's
reimplementation of manifest recovery.

---

## Migration path

- **Existing components keep working.** Their `bundledJs` is untouched until rebundled.
- **Backfill is required for the manifest**, and is safe — derived from `source`, no browser.
- **Rebundling changes every `sha256`.** Anything comparing shas across the change sees a full
  invalidation.
- **Components with helpers are currently broken in ways nobody has noticed.** Rebundling fixes them.
  That is still a behaviour change to shipped output, even though it is a fix.
- **Editor users see no difference** except that bundling becomes a server round-trip — unless preview
  stays local, in which case they see none at all.

---

## Cost estimate

| Item                                                        | Estimate                         |
| ----------------------------------------------------------- | -------------------------------- |
| Server bundler (port AST logic, fix body derivation, tests) | **3–4 days**                     |
| Wasm delivery (layer or `/tmp` fetch, plus deploy plumbing) | **2–3 days** — least predictable |
| Editor changes (call the mutation, optional preview split)  | **1–2 days**                     |
| Manifest persistence + backfill                             | **1–2 days**                     |
| Pipeline integration at Promote                             | **1 day**                        |

Roughly **1.5–2 weeks**, with wasm delivery carrying most of the risk.

---

## Risks

- **Not code execution.** Bundling only transforms, so the usual "running untrusted generated code on
  the server" risk does not apply. It _would_ apply the moment anyone tries to produce the manifest by
  executing the bundle — one more reason to persist it instead.
- **esbuild parsing hostile input** is the realistic surface: a pathological source could be slow or
  memory-hungry. Bounded by a timeout and the existing validation.
- **Wasm delivery is the schedule risk.** A layer adds deploy complexity; a `/tmp` fetch adds
  cold-start latency and an egress allowlist entry.
- **Silent sha churn** if rebundling happens without announcing it.
- **The inlined local path** in the deployed handler suggests the build traces `import.meta.url`
  statically; worth checking it does not bite elsewhere.

---

## Open questions for Sven

1. **Rebundle existing components, or only new ones?** Rebundling fixes the dropped-helper bug but
   changes every sha and touches components customers are using. Leaving them means two generations of
   bundle in the wild. _This determines whether the work is a fix or a migration, and should be settled
   before an implementation brief is written._
2. **Does the editor keep a local preview build?** Removing it is simplest and guarantees one bundler;
   keeping it costs a shared module and a conformance test to stop it drifting again.
3. **Wasm delivery: layer or `/tmp` fetch?** A layer is cleaner but is infrastructure; the fetch is
   self-contained but needs egress and adds cold-start time.
4. **Should bundling block Promote?** If a component fails to bundle, is it still promoted (and
   unusable), or does Promote refuse it?
5. **Is `status` meant to mean something?** It is free text defaulting to `"draft"` and nothing ever
   sets it otherwise. If the pipeline should know "ready to place", this is where it would live — but
   what the states are is a product decision.

---

## Appendix — how the measurements were taken

All figures come from the real built modules, not reimplementations.

- **Bundler timing, memory and the nested-input failure**: imported
  `packages/remote-components/dist/api/bundler/index.js` into plain Node 24 and bundled three
  component shapes (minimal, flat input, nested object input), cold and warm.
- **The divergence between the two bundlers**: applied each implementation's body-derivation logic —
  the server's regex replacement and the browser's acorn AST slice — to one source containing a
  module-level constant and a helper component, and compared what survived.
- **Bundle size and wasm presence**: inspected `.webiny/workspace/apps/api/graphql/build/`.
- **The nested-brace regex**: executed `buildManifestCode`'s `inputEntryPattern` directly against flat
  and nested `params` to see what it captures.
