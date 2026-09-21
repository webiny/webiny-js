# Investigation Report — Model Templates & CMS Live Preview

_Status: Sections 1–2 complete (both checkpoints passed). Sections 3–9 pending._

---

## Section 1: Existing data-binding foundation

### Q1 — Where it lives, package, scope; element-fetches-own-data vs. declarative layer

**Both models exist in the codebase; the one that matters here is the declarative layer.**

The declarative binding layer lives in **`packages/website-builder-sdk`** (`@webiny/website-builder-sdk`), a framework-agnostic TypeScript core. Renderers: `website-builder-react`, `website-builder-vue`, `website-builder-nextjs`. Editor integration: `app-website-builder`.

It sits **above** the element tree. A `Document` (`website-builder-sdk/src/types.ts:310`) carries two parallel maps:

- `elements: ElementMap` — the structural tree (`DocumentElement` = id, component ref, parent/slot, styles).
- `bindings: DocumentBindings` — a separate `{ [elementId]: DocumentElementBindings }` map (`types.ts:80`).

Elements do **not** fetch their own data; each element's inputs/styles are computed by resolving its binding entry against a document-level `state`. `DocumentElementBindings` (`types.ts:67`) = `{ $repeat?, inputs?, styles?, metadata?, overrides? }` (overrides = per-breakpoint).

Scope today: **drive a component's `inputs` and CSS `styles`, per breakpoint, with a repeater, from static values / design-token references / JS expressions over a shared `state`.**

Two caveats:

1. The _public_ Next.js starter path (Server Component calling `sdk.cms.listEntries`, per the `webiny-website-builder` skill) IS the "element fetches its own data" model. It coexists but is not a binding system.
2. A **second, separate** resolver exists in `packages/cms-sdk` (`ComponentResolver`, `ComponentRegistry`) + `packages/cms-nextjs` (`EntryRenderer`, `DynamicZoneField`). It maps a CMS **dynamic-zone** value onto a registered component via `model.metadata.componentMap[_templateId]` (`cms-sdk/src/component/ComponentResolver.ts:15`). Shipped CMS-entry→component bridge, but per-dynamic-zone-field, not whole-entry template binding. Closest existing precedent; a _different_ subsystem from the WB binding layer.

### Q2 — What a binding can currently express

`ValueBinding = { static?, expression?, token? }` (`types.ts:47`), exactly one meaningful. `resolveBinding` (`BindingsResolver.ts:169`) dispatches:

| Kind         | Mechanism                                                                | Capability                              |
| ------------ | ------------------------------------------------------------------------ | --------------------------------------- |
| `static`     | returned verbatim                                                        | any literal                             |
| `token`      | `TokenReference { path, fallback }` → `tokenToCssValue` → `var(--wby-…)` | design-token reference (theme-app work) |
| `expression` | `evaluateExpression` (`BindingsResolver.ts:187`)                         | **arbitrary JS string**                 |

Expression evaluator builds `new Function(...contextKeys, "return <expr>")` with context `{ state, $ }` (`$` = current repeat item); rewrites leading `$state`→`state` and `.0`→`[0]`. Concretely:

- Scalar field access — `$state.title` ✓
- Nested path — `$state.author.name` ✓
- Array indexing — `$state.items.0.name` ✓
- Reference traversal — `$state.product.category.name` works **only if `state` already contains that shape**; no fetch/join.
- Transform/formatting — arbitrary raw JS (`$state.price.toFixed(2)`); **no** declarative/sandboxed pipeline, and `new Function` is unsandboxed eval.

`$repeat` (`RepeatValueBinding { expression }`, `types.ts:53`) is a real repeater (see Q5).

### Q3 — Where a binding is evaluated

`BindingsResolver` is pure TS (`environment.isServer/isClient` exist → isomorphic-capable). Instantiated in three places:

- **Editor (browser):** `app-website-builder/src/editorSdk/utils/$getElementInputValues.ts:30`, `$updateElementInputs.ts`.
- **Live render (React):** `website-builder-react/.../ElementRenderer.tsx` (`"use client"`, `observer`) → `LiveElementRenderer` → `contentSdk.resolveElement`.
- **Live render (Vue):** `website-builder-vue/.../ElementRenderer.ts` — same shape.

Public entry points: `contentSdk.resolveElement()` (`ContentSdk.ts:192`) and the editor's `$getElementInputValues`. No Lambda-side evaluation today (API stores documents; does not resolve). **NB: corrected in Section 2 — the live renderer resolves in render and is SSR-capable/-intended.**

### Q4 — External-to-page data source / CMS entry as page context

**The slot exists; the mechanism does not.** `Document.state: DocumentState` (`types.ts:312`) is the injection point that all `$state` expressions read; explicitly **not persisted to the DB**. Nothing populates it from a content source. `app-website-builder/planning/pageWithDataSource.js` sketches `dataSources: [{ name, type: "rest"|"graphql", config }]` → `state` keys, but it is a **planning artefact, not implemented** (its `$collection`/`$current` keywords do not exist in code; shipped code uses `$repeat` + `$`). The feature would supply `state` from a CMS entry — which the resolver is already built to consume.

### Q5 — Repeater / loop / list expansion

**Already exists.** `DocumentElementBindings.$repeat` (`types.ts:68`). `BindingsResolver.resolveElement` (`BindingsResolver.ts:33-62`) resolves the repeat expression to an array and maps each item through `resolveSingleInstance` with `context = { state, $: item }`. True one-definition→N-instances expansion. Gaps vs contract `repeat: { path, index, key }`: keys **by array index only** (no stable key), no `repeat` provenance emitted, nested-list paths index-encoded as flat slash keys (`node/0`, `getUniqueIndexesFromPath`, `BindingsResolver.ts:155`). **Stable keys now required, not additive-later (Correction 3).**

### Q6 — Distance from `PropValue`

Output is **untyped/untagged**: `ResolvedElement = { id, inputs: Record<string,any>, styles }` (WB core); `ResolvedComponent = { component, props: Record<string,unknown>, … }`. No `{ kind, value }` discriminant, no `BindingTrace`, no `repeat` provenance, no `diagnostics`, no `mode`.

| Target `PropValue.kind`   | Current representation                                        | Gap                                                   |
| ------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| `scalar`                  | bare `string \| number \| boolean`                            | untagged                                              |
| `richText`                | Lexical `{ html?, state? }`                                   | untagged; contract wants `RichTextDocument` (Q33)     |
| `asset`                   | file input `{ id, name, size, mimeType, src, width, height }` | untagged; not an `AssetRef` (Q32)                     |
| `link`                    | **no link input** — URL is `createTextInput` (`string`)       | no `{ href, target, rel }` producer at all            |
| `reference`               | **no reference input in WB**                                  | absent; `{ modelId, entryId, title }` has no producer |
| `list`                    | plain array                                                   | untagged                                              |
| `object`                  | plain nested object (`createObjectInput`)                     | untagged                                              |
| `bindings`/`BindingTrace` | none                                                          | must be added                                         |
| `repeat` provenance       | none (index only)                                             | must be added                                         |
| `diagnostics`/`mode`      | none                                                          | must be added                                         |

**Net:** every value class exists except **`link`** and **`reference`** (no producer). The larger gap is that nothing is tagged and there is no provenance — all additive over a working resolver.

### Section 1 bottom line

- Real, shipping declarative binding layer in `website-builder-sdk` (bindings above elements; `static|token|expression` over `state`; responsive overrides; `$repeat`; runs in React/Vue renderers).
- **Extension, not new subsystem**, with two holes: (a) nothing populates `state` from a CMS entry (dataSources is only planning), (b) output is untagged — `PropValue`/`BindingTrace`/provenance/diagnostics/`mode` must be added; `link`/`reference` have no producer.
- Two resolvers stay separate (WB bindings vs CMS dynamic-zone→component) — they meet at `slots` (Correction 2).
- Carry to Section 2: expressions use unsandboxed `new Function`; resolution runs client-side in the editor and (corrected) in-render/SSR in the live path.

### Corrections accepted (locked)

1. **Restricted path grammar.** Add a 4th `ValueBinding` kind `path` (restricted: field access, array index, reference traversal, whitelisted transforms). `expression` stays for existing WB pages. Model-bound templates accept `path` only, enforced at template publish. Rationale: arbitrary JS breaks the dependency index (Q19), the compiled fetch plan (Q28), and publish-time type validation; and generated/migration templates must not eval model-authored JS server-side.
2. **Do not converge the resolvers.** Template resolver = `website-builder-sdk` resolver fed by CMS entry state. `cms-sdk` `ComponentResolver` stays separate (dynamic-zone block→component). Integration point = `slots`: a dynamic-zone field resolves into a named slot in the resolved tree.
3. **Stable repeat keys are required now**, delivered in the same change as repeat provenance (index-only keying breaks click-to-edit focus sync on reorder + causes reconciliation churn).

---

## Section 2: Resolver placement and preview transport

### Addition 1 — the server-side rendering path (answered first)

**a) Server-render path today?** **Yes, and it is the intended one.** Resolution is **synchronous in render**, not effect-deferred: `LiveElementRenderer.tsx:58` calls `contentSdk.resolveElement({ element, state, elementBindings, onResolved })` in the render body; only breakpoint refinement (`"desktop"`→real) is in `useEffect`. Code is explicit: _"Start breakpoint as 'desktop' on both server and initial client render"_ (`LiveElementRenderer.tsx:23`); Vue twin says _"SSR-safe"_. `"use client"` ≠ client-only in the Next.js App Router — client components are server-rendered into initial HTML then hydrated. `LiveSdk.getPage` (`LiveSdk.ts:18`) is a server-side fetch; `DocumentStoreProvider` calls `store.setDocument(document)` during render (`DocumentStoreProvider.tsx:19`), so the resolver reads a populated document in the same SSR pass. (My Section 1 caution was too strong for the live path.)

**b) What a crawler gets:** full resolved HTML, provided the host Next.js route is SSR/SSG (the `getPage`-in-route pattern). Bindings resolved server-side into the initial payload; hydration re-runs the same resolution. Not an empty shell.

**c) Server-resolved template tree + is MobX in the way?** Resolver needs no store — `$getElementInputValues.ts:30` already resolves via `new BindingsResolver(document.state)` directly, no MobX. What sits in the way is the **module-level singleton store**: `documentStoreManager` (`DocumentStoreManager.ts:27`) and CMS twin `entryStoreManager` (`cms-sdk/src/EntryStoreManager.ts`) — process-global `Map`s keyed by document id. On a server: **no request isolation** (two concurrent requests for different entries of the same template would clobber each other's `state` unless store ids are unique per entry+request) and **unbounded growth** (never evicted). → The template server resolver must be **stateless and store-free**: pure `(compiledTemplate, entry, locale) → ResolvedDocument`, new `BindingsResolver` per call with the entry as `state`, never touching `documentStoreManager`. **Hard requirement** for the 12k-page migration path.

### Q7 — Same resolution in Lambda and browser?

Same pure core (`BindingsResolver`, `ComponentResolver`, `BindingsProcessor`, `tokenBinding`) runs in browser (editor `$getElementInputValues`) and browser+server (live/SSR `LiveElementRenderer`). Framework-agnostic TS package with `environment.isClient/isServer/isEditing` guards; thin React/Vue/Next adapters. Constraint: browser-only globals quarantined behind `environment` checks; shared state lives in module singletons (safe in browser, hostile on a shared server). "Isomorphic" is true for the _logic_, not yet for _state ownership_. No Webiny Lambda resolves bindings today — SSR happens in the customer's Next.js runtime.

### Q8 — WB editor's own preview: unsaved change → pixels

**Already Option B**, no server round-trip, no write:

1. Editor loads the customer Next.js app in an **iframe** with `?wb.type=entry&wb.referrer=…`; inside, `environment.isEditing()` true → `ContentSdk.init` builds an **`EditingSdk`** (`ContentSdk.ts:112`).
2. `EditingSdk` opens a `postMessage` `Messenger` to `window.parent` (`EditingSdk.ts:33`) and subscribes to `document.set`/`element.set`/`document.patch`/`theme.mode` (`EditingSdk.ts:88-120`).
3. Every editor mutation posts the new document / JSON patch; the listener writes it into the MobX `DocumentStore`.
4. `LiveElementRenderer` is a MobX `observer`; the mutation re-renders and calls `contentSdk.resolveElement(...)` synchronously against in-memory unsaved state. Position boxes reported back via `preview.viewport` on a 300 ms interval (`reportBoxes`, `EditingSdk.ts:150`).

Rendering happens **in the browser, inside the preview iframe**. The platform's native "unsaved state → preview" mechanism is postMessage, not a server endpoint.

### Correction 1 — the restricted `path` grammar (proposed)

Stored as a **parsed AST, never an eval'd string**:

```ts
type ValueBinding<T = any> = {
  static?: T;
  expression?: string; // existing WB pages only; forbidden in model-bound templates
  token?: TokenReference;
  path?: PathBinding; // NEW — the only data-binding kind a template may hold
};

type PathBinding = {
  segments: PathSegment[]; // structured; index & fetch plan read this, never a string
  transforms?: TransformRef[]; // ordered, whitelisted, pure
};

type PathSegment =
  | { kind: "field"; name: string } // author.name    (scalar/object field)
  | { kind: "index"; value: number } // gallery[0]      (array index)
  | { kind: "ref"; name: string }; // category ->     (reference hop; counts toward depth)

type TransformRef = { name: string; args?: Array<string | number | boolean> };
```

- Field/nested path = run of `field` segments. Array index = `index` segment.
- `ref` = the only segment triggering a cross-entry read → compiler enumerates every hop into the fetch plan; index records transitive deps (Q19/Q21). **Slice 1 forbids `ref`** (validated at publish).
- Whitelisted transforms = `{ name, args }` into a fixed registry of pure functions shared verbatim client+server (`uppercase`, `lowercase`, `trim`, `default`, `truncate`, `date(format)`, `number(format)`, `currency(code)`, `join(sep)`, `plainText`, `assetUrl`). No arbitrary code; unknown name ⇒ publish error.
- Authoring string (e.g. `author.category.name | uppercase`) is parsed to the AST at publish; only the AST persists. Runtime never parses/evals.
- **Reference depth limit:** compile-time ceiling of **2 ref hops** (entry → ref → ref); slice 1 = 0. (Reconciled in Q21.)

Resolver for `path` is a ~50-line pure walker vs `evaluateExpression`'s `new Function` — this size/safety gap is the pivot for Q9.

### Q9 — Option B (client resolver) feasibility under `path`

- **Bundle size:** resolver core already ships to browser; adding the `path` walker + pure transform registry is negligible. Model-bound templates resolve **without** the `new Function` evaluator (confine it to legacy WB `expression`).
- **No unsafe eval:** `path`-only templates contain no code evaluation client-side — removes the biggest Option B objection.
- **Reference traversal is the one blocker:** browser holds the unsaved primary entry, not referenced entries → see Q11. **Slice 1 has no `ref`, so Option B is fully self-contained for slice 1.**
- **Permissions:** `path` reads only fields of the already-authorised, already-loaded entry form; no permission decision made client-side. Reference values must stay server-mediated.

### Q10 — Option A (server resolve) latency + transient-endpoint precedent

- **Latency:** stateless resolve is sub-ms, but round trip ≈ **80–250 ms per keystroke-batch** (network + cold-start jitter) vs single-digit ms for Option B. Needs debouncing; laggier for live typing.
- **Precedent:** **none** for "POST unsaved state, resolve, return, no write." Existing preview mechanisms: (1) postMessage iframe (unsaved, client-side, no write — `EditingSdk`); (2) draft-preview-by-**id** via `PreviewSdk`/`PreviewDocument` (`PreviewSdk.ts:22`), which reads an already-**saved** draft. Option A is a **new transport pattern**; Option B reuses an existing one.

### Q11 — Hybrid split for reference traversal

Clean split falls out of the compiled template: compiler partitions bindings into **scalar/local paths** (resolvable against in-editor entry) and **`ref` paths** (need other entries). Client resolves local partition instantly; server supplies the reference partition via a small permission-checked, cacheable endpoint `(compiledTemplateId, { refField: entryId, … }) → contributing values`, merged into `state` and resolved by the same `path` walker. **Worth it? For slice 1, no** (no `ref` paths) — ship the pure client resolver. Add the split only when reference traversal lands, where it doubles as the Q28 batched fetch plan.

### Addition 2 — `link` and `reference` producers

- **`link` (slice 1):** no `link` input today (`ComponentInput` union `types.ts:515-577`; URL = `createTextInput`/`string`). Add: `LinkInput` type + `createLinkInput` → `{ href, target?, rel? }`; admin renderer; `path`/`static` producer emitting `PropValue{ kind: "link" }`; compile-time type-compat rule (CMS URL/text → `link`). Small, self-contained; the object-shaped `file` input is the precedent for a non-scalar input value.
- **`reference` (out of scope for slice 1):** new `reference` input backed by a CMS **ref field**, emitting `PropValue{ kind: "reference"; value: { modelId, entryId, title } }` (`title` from referenced model's title field). Server-mediated; lands with the Q11 reference-fetch / Q28 batched plan.

### Q12 — Recommendation

**Build Option B (client-side resolver in the entry-editor preview iframe) on the `path` grammar for the preview surface — and, independently, build a stateless store-free server resolver for the published/migration render path.** Two consumers of one pure resolver (the shape the codebase already has: editor-client + SSR-server sharing `BindingsResolver`).

Reasoning:

1. Option B reuses the proven postMessage-iframe transport; Option A needs a brand-new post-unsaved-state endpoint.
2. `path` removes Option B's only real risk (no eval reaches the browser).
3. Latency: Option B single-digit ms; Option A debounced ~100–250 ms.
4. Reference traversal doesn't force Option A now (slice 1 has no `ref`; hybrid adds a server reference-fetch later without moving the whole resolver).
5. Migration/SEO is a separate concern and must be server-side regardless — the stateless resolver bypassing `documentStoreManager`.

**First irreversible commitment:**

- **Option B (recommended):** model-bound templates are **`path`-only and resolvable without server data for the non-reference partition** — compiled template must separate local vs reference paths; entry editor must expose unsaved form state to the preview iframe. Reversing to all-server-side later is a data-model/contract change.
- **Option A:** the **transient resolve endpoint + wire contract** (posted entry-state shape + returned `ResolvedDocument`); every client couples to it; walking back means re-shipping the resolver to the browser anyway.
- **Lowest-regret, common to both, needed now for migration:** land the **stateless store-free server resolver** `(compiledTemplate, entry, locale) → ResolvedDocument` that never touches `documentStoreManager`. Required for SEO/migration regardless of preview transport; the preview surface can call the same pure function.

### Q39 flags surfaced so far (redesign-forcing, Sections 1/2)

- Untagged resolver output + no provenance → `PropValue`/`BindingTrace` is a resolver output-format change (additive but pervasive).
- `new Function` expression evaluator is incompatible with dependency index + fetch plan + publish-time validation + safe server eval → **`path` grammar required** (accepted).
- Module-singleton document/entry stores are not request-isolated → **stateless server resolver required** for migration/SEO.

---

## Section 3: Template as an entity

### Q13 — Storage precedent

WB pages are **not** a bespoke store — they are **entries of a private CMS model** (`wbyWbPage`, `builder.private({ modelId: PAGE_MODEL_ID })`, `api-website-builder/src/domain/page/page.model.ts:5-27`), which already carries a `bindings` json field alongside `properties/metadata/elements/extensions`. That inheritance gives pages draft→publish, numbered revisions, locking, trash/restore, tenant + locale scoping for free (`EntryToPageMapper.ts:6-35`). The closest analogue for a new template entity is the WB **Variant**/**Experiment**: a _separate_ private CMS model that snapshots content but is its own record ("A variant is never a revision", `domain/variant/variant.model.ts:5-33`; `domain/experiment/experiment.model.ts`).

**Recommendation:** make **Model Template** its own **private CMS model** in `api-website-builder`, mirroring Variant/Experiment. It is not a page variant (it has no entry of its own; it binds to a model), and not a raw CMS user model (it is design-system infrastructure, private). A separate simple-DDB store (`api-core/src/models/simple/…`) exists but is not the route used by any versioned/publishable WB entity.

### Q14 — Collision with the existing "template" concept

There is **no** WB page-template/block-template entity in this tree. "Template" today means two lower-level things: (1) **dynamic-zone field templates** keyed by `_templateId` → component via `componentMap` (`api-headless-cms/.../DynamicZoneFieldType.ts:12-112`; `cms-sdk/.../ComponentResolver.ts:16-33`) — this is exactly the `slots` integration point from Correction 2; (2) **admin object-field templates** (`app-admin/.../ObjectFieldType.ts`). Both are field-level.

**Naming:** call the new entity **Model Template** (`wbyWbModelTemplate`), and keep lowercase "template"/`_templateId` for the dynamic-zone meaning. Avoid `PageTemplate`/`BlockTemplate`. The overload is real but at a different layer, so collision is avoidable by name discipline.

### Q15 — Inherit publishing / versioning / revisions / rollback?

**Yes, essentially unmodified** — those behaviours come from the CMS entry layer, not page code. A new private model inherits draft→publish (`status`/`live`/`locked`), numbered revisions (`version`, `EntryId.incrementVersion`, `contentEntry/EntryId.ts:32-51`), and **rollback = create-revision-from** (there is no in-place rollback; `CreatePageRevisionFromUseCase.ts:23-58` fires before/after events). What must be re-implemented is the thin WB use-case + domain-event wrappers per entity (Publish/Update/CreateRevisionFrom), analogous to the page ones (`features/pages/PublishPage/PublishPageUseCase.ts:20-62`). Mechanics underneath are unchanged.

### Q16 — Compile-on-publish hook + artefact storage

The right hook exists. `PublishPageUseCase` fires **`…BeforePublishEvent`** and **`…AfterPublishEvent`**, dispatched **awaited and unguarded** (a throw propagates, `app/src/features/eventPublisher/EventPublisher.ts:8-20`). So a compiler subscribed to the template's before-publish event can (a) compile the `path`-AST + fetch plan and persist it onto the record about to be locked, and (b) **block a bad publish** by throwing (type-incompatibility, unknown transform, ref-depth > 2). This is the enforcement point for "templates accept `path` only" and for publish-time type validation.

**Where the compiled artefact lives:** the **same record**, in a `json` field (e.g. `compiledPlan`) beside `bindings` — exactly how pages already store parsed structure in a json field (`page.model.ts:12-18`). Same-record storage means the compiled plan is versioned and locked together with the published revision automatically; a separate record or KV store would lose that per-revision snapshot. (See Correction 6 for the registry-version stamp that must be written into `compiledPlan`.)

### Q17 — Template selection: default-per-model + per-entry override

- **Default per model:** store `model.settings.defaultTemplateId`. `model.settings` is an open persisted bag (`IModelSettings { [key: string]: any }`, `modelBuilder/abstractions.ts:10-15`) already holding `previewPrefix`, `previewSlug`, `aiEntryWizard`, surfaced as `settings: JSON` (`graphql/schema/contentModels.ts:367`). A resolved pointer can additionally be exposed through the computed `CmsContentModelMetadata` mechanism (`componentMap`/`refModels` generators) if you want it derived on read rather than authored.
- **Per-entry override:** model it as a **system field on the entry**, following the ACO `location` precedent — a system field injected onto every model so each entry carries `location.folderId` (`EntryToPageMapper.ts:10-12`; `api-headless-cms-aco/.../SetLocationOnEntryRestore.ts:12-27`). A `templateOverride` system field read off the entry at resolve time is the house style; a separate mapping table is **not** (per-entry metadata rides on the entry).

---

## Section 4: Dependency index

### Q18 — Field lifecycle events (rename / retype / delete)

There are **no per-field events** — fields are an array on the model, so rename/retype/delete all flow through **model update**, which publishes **`ModelBeforeUpdateEvent`** (`Cms/Model/BeforeUpdate`) and **`ModelAfterUpdateEvent`**, each carrying `{ model, original, input }` (`features/contentModel/UpdateModel/events.ts:9-25`). A handler diffs `original.fields` vs `model.fields` to classify the change. The before-event is published **before** the repository write and a throw aborts the update (`UpdateModelUseCase.ts:113-134`) — so **before-change can hard-block**; after-change is for reindexing. Today the only update guard is model API-name compatibility (`crud/contentModel/compatibility/modelApiName.ts`); there is **no** field-removal/retype guard.

### Q19 — Where the index lives + queries

Queries: **primary** "which templates reference field X on model Y" (destructive-change path); **secondary** "which fields does template T depend on" (compile/impact display).

**Recommendation: a dedicated private CMS model** (`wbyWbTemplateDependency`), consistent with Variant/Experiment/Redirect, inheriting list/query/tenant/locale scoping and searchable fields. Row shape: `{ modelId, fieldId, templateId, templateVersion, hop, via? }`; primary query = filtered list on `modelId`+`fieldId`. If reverse-lookup latency on the hot model-save path proves critical, promote to a **direct-DDB simple model** with a GSI (`modelId#fieldId → templateId`) (`api-core/src/models/simple/…`). Same-record embedding answers only the secondary query, not the reverse one — so the index must be its own store. There is no generic KV store distinct from CMS-entries/DDB in this tree.

### Q20 — Block or warn on destructive change

- **API hard-block is feasible** via a `ModelBeforeUpdateEventHandler` that diffs fields, queries the index, and throws when an indexed field is removed/retyped (`UpdateModelUseCase.ts:113-119`). Authoritative.
- **Admin UI has no destructive-change warning today** — field deletion is a silent in-memory transform (`FieldEditor/utils/deleteField.ts`) then a wholesale model save. The strongest _current_ affordance is the save-time API error surfaced from the block above (manifests as an update failure, not an inline banner). A friendly warning banner (call the index before save) is **net-new UI**.

**Recommendation:** implement the block in `ModelBeforeUpdateEvent` (source of truth) plus an advisory pre-save index check for UX.

### Q21 — Transitive dependencies + depth limit

Supported by existing machinery: **`RefModelsGenerator`** already walks a model AST, collects `ref` fields' target model ids (`field.settings.models`), and recurses (`features/contentModel/RefModelsGenerator/RefModelsGenerator.ts`; shares `ModelToAstConverter` with `ComponentMapGenerator`). The template compiler reuses this to follow `path` `ref` segments.

**Depth limit = max 2 ref hops**, encoded per index row via `hop`. A binding `article.author.name` emits:

- `{ modelId:"article", fieldId:"author", templateId:T, hop:0 }`
- `{ modelId:"author", fieldId:"name", templateId:T, hop:1, via:"article.author" }`

The reverse query matches `modelId=Y, fieldId=X` at **any** hop, so renaming `author.name` on the referenced model is caught even though the template binds `article`. Cap emitted rows at `hop ≤ 2` (slice 1 = 0 hops).

### Correction 4 — repeat bindings become path-based

`RepeatValueBinding = { expression }` (`types.ts:53`) → **`{ path: PathBinding; keyPath?: PathSegment[] }`**. An `expression` repeat source is opaque: it can neither be enumerated into the fetch plan nor recorded in the dependency index, so every expression-repeat forces lazy N+1 during the tree walk. A `ref`-list is a normal `ref` field with `list:true` (a first-class flag, `cms-sdk/src/types.ts:74-78`), fully enumerable from the model AST — so a path-based repeat source lands in **both** the index and the fetch plan.

**Repeat-over-reference-list in the fetch plan** — a collection read node:

```ts
type FetchPlanCollectionNode = {
  kind: "refList";
  sourcePath: PathSegment[]; // e.g. product.relatedProducts → an entry-id list
  targetModelId: string;
  depth: number; // ref hops consumed (≤ 2)
  childProjection: string[]; // the $-relative field paths the child elements read
  children?: FetchPlanNode[]; // deeper collection/ref nodes
};
```

Read pattern: read the parent field → id list → **one** batched multi-get of `childProjection` for all ids → resolve each instance's `$`-relative paths. This is precisely the batching Q28 needs.

---

## Section 5: Preview surface in the CMS entry editor

### Q22 — Extension points / split-pane precedent

The entry-editor config `ContentEntryEditorConfig` exposes only `{ actions, width, newEntryWizards }` (`app-headless-cms/.../editor/ContentEntryEditorConfig.tsx:35-39`; default width `"1020px"`) — **no panel/split-pane slot**. A preview panel registers instead by **decorating the entry-form components via `@webiny/react-composition` (`makeDecoratable`/`compose`)**: `ContentEntryForm` and `ContentEntryFormContent` are both decoratable (`presentation/contentEntries/views/layout/ContentEntryForm.tsx:8-24`, `ContentEntryFormContent.tsx:9-20`), and the composition store supports scoped decorators (`react-composition/src/domain/CompositionStore.ts:20-80`). The decorator wraps the centered form in a split container and mounts the preview iframe alongside. There is **no split-pane inside the entry form today**, but reusable split primitives exist (`SplitView`/`LeftPanel`/`RightPanel` from `@webiny/app-admin`, used by the ref drawer; `FileDetails` flex split).

### Q23 — Field ↔ element click-sync

**Both directions are feasible; element→field needs essentially nothing new.**

- **Focus/scroll to a field already exists:** `FormModel.focusField(name)` resolves and activates the containing tab(s) then calls `field.requestFocus()` (`app-admin/.../formModel/FormModel.ts:172-197`), surfaced as `vm.focusField(path)` (`:437`). Preview→form = `form.focusField(bindingPath)`.
- **Stable field path exists:** fields are addressed by a dot-path handling nested objects and list indices (`FormModel.field(name)`, `:135-170`; `Field.field()` composes `${path}.${name}`); the same path keys `getData()/setData()` and errors carry `path`. **This dot-path is the natural `BindingTrace.path`.**
- What the form must add: (1) a stable map from a preview element's binding to the field path (a template concern — `BindingTrace`), and (2) field renderers that **visibly** highlight + scroll on the MobX `requestFocus` flag (today the flag is set; the renderer-level visual reaction is unverified — see gaps).

### Q24 — Secondary entry without losing primary unsaved state

**Fully supported, with a working precedent.** The reference-field renderers open a second, independent entry form in a `Drawer`, each backed by its **own DI child container and its own `ContentEntryFormPresenter`/`FormModel`** (`fieldRenderers/ref/components/EditEntryDrawer.tsx:37-65`, `NewEntryDrawer.tsx:24-53`; `createChildContainer` via `DiContainerProvider`). The primary form's unsaved MobX state is untouched; concurrent forms are already the norm. A `BindingTrace.entryId` click-to-edit opens the referenced entry through this exact pattern.

### Q25 — Locale + Correction 7 (locale/timezone as explicit resolver inputs)

**Gap.** In the rewritten DI/feature CMS admin, an active **content locale is not threaded** into the entry editor: `CmsGraphQLClient` targets `${apiUrl}/cms/manage` with **no locale segment and no `x-i18n-locale` header** (`features/graphQLClient/CmsGraphQLClient.ts:12,18`; fetch client sets only `Content-Type`, `app/.../FetchGraphQLClient.ts:25-33`). The generic `I18n.getLocale()` is the UI-translation locale, not content locale. So resolution today would run against the API's tenant-default locale.

**Correction 7 confirmed and now grounded:** locale/timezone have **no ambient source to fall back on even if we wanted one** — they must be explicit resolver-context inputs. Required work: introduce a content-locale context in admin, thread it into `CmsGraphQLClient` (endpoint or header) **and** into the resolver context:

```ts
type ResolverContext = {
  state;
  $?;
  locale: string /*BCP-47*/;
  timeZone: string /*IANA*/;
  now?: string;
};
```

`date`/`number`/`currency` transforms take `ctx.locale`+`ctx.timeZone` explicitly. **Residual risk:** native `Intl` diverges across Node ICU builds vs browser engines even for the same locale → preview/production drift. Fix: ship a **deterministic formatter** for the ICU-sensitive transforms in the shared transform package (Correction 6) rather than native `Intl`; plain-string transforms are ICU-independent and fine.

### Addition 3 — Preview host (Webiny-served vs customer frontend)

**(a) A Webiny-served preview surface is largely already built.** The CMS analog of the WB preview exists: `@webiny/cms-sdk` `EditingSdk` sets up the `Messenger` on `"wb.editor.*"`, reads `wb.id`/`wb.referrer`, and applies `document.set`/`document.patch` into an `EntryStore`, gated on `environment.isEditing()` (`cms-sdk/src/EditingSdk.ts:18-85`, `ContentSdk.ts:51-66`); `@webiny/cms-nextjs` `EntryRenderer` + `ConnectToEntryEditor` render an entry against a model + component registry, switching to editor-connected mode when editing (`cms-nextjs/src/EntryRenderer.tsx:22-67`). `website-builder-react`'s `DocumentRenderer`/`DocumentStoreProvider`/`ElementRenderer` are usable **standalone** given a document + registry. Theme for a Webiny-served surface: `@webiny/theme-sdk` `ThemeSdk` fetches the tenant's published theme and supports draft-theme preview (`theme-sdk/src/ThemeSdk.ts:68-131`). Admin already hosts sandboxed preview iframes (WB editor `Iframe.tsx`; remote-components `SandboxIframe`).

**(b) One implementation can serve both hosts** — renderer and postMessage transport are identical; three inputs differ: **theme source** (customer app applies its deployed theme vs Webiny-served fetches published/draft theme via `theme-sdk`), **component registry source** (customer registers _its_ components vs Webiny-served has only defaults unless the customer's set is loaded — the crux for migration customers with no frontend), and **host origin**.

**(c) Preview host is a per-tenant choice, not per-template/per-model.** The only existing preview-host config is WB-wide: `PreviewUrlModifier` (tenant-level URL hook, `features/previewUrl/abstractions.ts:3-9`) + WB settings base URL (`IWebsiteBuilderSettings`). No per-template/per-model preview-host setting exists; below-tenant granularity would be net-new. **Decision surfaced for Q37.**

---

## Section 6: Delivery, caching and invalidation

Up front: there is **no compiled template and no server-side `ResolvedDocument` today** — this whole path is greenfield. Findings below are the machinery a producer attaches to.

### Q26 — Where resolution sits in the delivery path

CMS delivery is **three separate schemas/endpoints**: `manage` `/cms/manage`, `preview` `/cms/preview`, `read` `/cms/read` (`createCmsRoute.ts:10-14`), each delegating to `CmsSchemaExecutor.execute(type, body)`. There is **also** a unified SDK-facing surface on the main `/graphql`: `Query.cms → CmsQuery { getEntry(…, preview: Boolean), listEntries, getModel }` (`graphql/schema/cms/typeDefs/query.ts:8-30`), whose `getEntry` resolver maps `preview ? "preview" : "read"` and runs the model-specific getter via `CmsSchemaExecutor` (`cms/getEntryResolver.ts:18-49`). **Attach the `ResolvedDocument` producer here** — a sibling field on `CmsQuery` (e.g. `resolveDocument(templateVersion, entryId, contentStatus)`) reusing `CmsSchemaExecutor` — stateless, matching the existing resolver shape, and the natural call site for the store-free server resolver from Section 2. WB pages today ship `PublicPage` (elements/bindings) to the client and resolve there; there is no server render-tree stage to extend, which is why the producer is new.

### Q27 — Cache tagging / surrogate keys

**None exists — caching is TTL/path-based only.** CloudFront uses AWS **managed** policies (`Managed-CachingDisabled`, `Managed-AllViewerExceptHostHeader`; `project-aws/.../createCloudFrontDefaultCacheBehaviorPolicies.ts:12-18`) — no custom cache key, no header allow-list for tags. The only invalidation is **path-based** (`InvalidateCloudfrontCacheTask` → `createInvalidation({ Paths })`, wired solely to File-Manager flush; `api-file-manager-s3/.../InvalidateCacheTask.ts:87-103`). WB Next.js middleware sets `no-store` **only in preview** (`website-builder-nextjs/src/middleware.ts:64-69`). **Everything the design needs is net-new:** no `Surrogate-Key`/`Cache-Tag` header on any delivery response, no tag-based invalidation API, no per-entry/per-template-version key. The tag set {template version, primary entry, every contributing referenced entry} would be emitted by the new `resolveDocument` producer (it already computes exactly that set as it walks the fetch plan → `ResolvedDocument.cache.tags`), plus a new tag-invalidation mechanism at the edge (surrogate-key CDN capability or a tag→path map feeding the existing path invalidator).

### Q28 — Batched multi-entry reads

**The server read layer already supports batched by-id reads; today's reference path does not use them (N+1).** Batched primitives exist: `GetPublishedEntriesByIdsUseCase` / `GetLatestEntriesByIdsUseCase` (`execute(model, ids[])`, `.../GetLatestEntriesByIds/…UseCase.ts:21-39`) over a batched storage op, plus per-tenant+model **DataLoaders** (`loadMany(ids)`, `api-headless-cms-ddb-es/.../dataLoaders.ts:36-104`). But reference resolution is currently **one `getEntry` per unique ref** (`cms-sdk/.../LiveSdk.ts:85-130` parallel-but-not-batched; `cms-nextjs RefField` resolves one id per `useEffect`). **The compiled fetch plan must emit referenced ids grouped by `(modelId, status)`** so the resolver issues **one** `GetPublishedEntriesByIds`/`GetLatestEntriesByIds` per group instead of per ref — matching the `FetchPlanCollectionNode.childProjection` from Correction 4. **The read layer can satisfy this;** the only missing piece is a batched entry point exposed to the resolver (the current `cms.getEntry` surface is single-id).

### Q29 — The four-state matrix

Status is selected by **which sub-API** you hit: `read` = published, `preview` = latest/draft; the unified `getEntry(preview: Boolean)` binary-maps to one of them (`getEntryResolver.ts:27`), and `preview` is a **single per-SDK-instance flag** (`ContentSDKConfig.preview`) routing **all** reads. Template status is orthogonal (published via `LiveSdk.getPage`; a specific draft revision via `PreviewSdk.getPage`→`getPageById` keyed off `?wb.preview`).

|                        | Published entry                | Draft entry                     |
| ---------------------- | ------------------------------ | ------------------------------- |
| **Published template** | ✅ live path                   | ⚠️ not independently selectable |
| **Draft template**     | ⚠️ **not cleanly expressible** | ✅ preview path                 |

The off-diagonal cells fail for the same reason: **one global `preview` flag routes both the template read and every CMS entry read to one endpoint.** Previewing a draft template forces entry reads into the preview/latest API too. **What must change:** the `resolveDocument` producer must accept **template version** and a **per-read content-status selector** independently, instead of a per-SDK-instance boolean. The sub-APIs to satisfy both statuses already exist (read + preview + by-id use cases); the selection just needs to be a per-resolve parameter. (Draft-template × published-entry — preview an unpublished template against live content — is a primary migration/authoring scenario, so this decoupling is required, not optional.)

---

## Section 7: Component identity, assets, rich text

### Q30 — Component identity + versioning

**Identity is a bare string `name` — there is NO version anywhere.** `ComponentManifest` has `name` (+ `group/label/tags`), no `version` (`website-builder-sdk/src/types.ts:257-287`); the element ref is `ElementComponent = { name: string }` (`types.ts:291-304`); the registry keys purely by `manifest.name` (`ComponentRegistry.ts:10-11,43,48`); `createComponent` never assigns a version. Names are `Group/Name` strings (`"Webiny/Image"`), not `name@version`. The `cms-sdk` twin is likewise name-only. **So `component:{name}@{version}` is net-new** — `ComponentManifest`, `ElementComponent`, and the registry `Map<string,…>` all need a `version` concept before two versions of a component can coexist or be distinguished. This dovetails with **Correction 6**: the same compiled artefact that stamps a component version must stamp the transform-registry version.

### Q31 — Unknown component behaviour

**Silent skip + `logger.warn`, no placeholder, in every mode.** `ComponentResolver.resolve` logs `Unknown component: …` and returns `null` (`ComponentResolver.ts:34-39`); `LiveElementRenderer` renders nothing on `null` (`LiveElementRenderer.tsx:58-67`); the warn is **not** environment-gated. Target behaviour (logged diagnostic + no published output + **visible preview placeholder**) is half-met: diagnostic ✓, empty published output ✓, **preview placeholder ✗** — it must be added in the renderer (the resolver returns `null` before either renderer, so the placeholder branch is new), keyed off `environment.isEditing()`/preview mode. This is the same seam the `diagnostics` array and fail-soft contract need.

### Q32 — Intrinsic image width/height

**Extracted and persisted, but async, best-effort, image-only, and under `file.metadata.image` — not a typed guarantee.** The `File` entity has no typed `width`/`height`; dimensions live in `metadata: Record<string,any>` (`api-file-manager/src/domain/file/types.ts:17-37`), written by a **post-upload background task** using `sharp` → `metadata.image.{width,height}` (`api-file-manager-server/.../ExtractMetadataTask.ts:63-94`, triggered by `FileAfterCreate`; `maxIterations=1`, image-only, `sharp` lazy-imported per the layer gotcha). The delivery metadata writer stores **no** dimensions (`MetadataWriter.ts:26-35`). The WB render layer already **assumes** intrinsic dims on the value (`ImageValue = { …, width, height }`, `website-builder-react/src/image/getImageProps.ts:23-31`; `normalizeToAsset` reads them off the value or a nested `image` sub-object, `asset/normalize.ts:70-142`). **For `next/image`:** dims exist **only if** the extract task ran (race window post-upload; absent for legacy files) and only for images. To make `asset` `PropValue` guarantee `width`/`height`, either promote dims to a typed/guaranteed field or resolve from `metadata.image` at prop-construction with a fallback + handle the not-yet-extracted case.

### Q33 — Rich text representation

**Lexical, with a structured JSON EditorState as source of truth + a lossy derived HTML.** The WB `lexical` input value is a JSON-serialized Lexical `EditorState` string (`LexicalValue = string`, `lexical-editor/src/types.ts:1`); admin carries both forms as `RichTextValueWithHtml = { state: string; html: string }` (`app-admin/.../LexicalEditor/lexicalValueWithHtml.ts:6-9`, html via `createLexicalStateTransformer().toHtml(state)`). Rendering **re-hydrates the JSON state** into a read-only `LexicalComposer` (`editable:false`, `allNodes`) — it does not dump raw HTML (`lexical-editor/.../LexicalHtmlRenderer.tsx:19-57`) — and themes headings/lists/etc. via `initialConfig.theme` (`$colors`/`$typography` tokens → classes like `wb-heading-1`). **For a `richText` `PropValue`:** carry the structured `{ state, html }` pair (not the bare string) — the JSON `state` is what lets a renderer map headings/lists/embeds onto theme typography via Lexical nodes; `html` is a lossy convenience. `RichTextDocument` in the contract = the Lexical EditorState JSON.

### Correction 5 — stable repeat key derivation (confirmed + refined)

Key derived at resolve time, emitted in `repeat: { path, index, key }`, priority order: (1) explicit `keyPath` on the repeat binding; (2) **CMS entry item → entry id** (id, _not_ revision, so editing a value doesn't remount); (3) plain object → **stable content hash** via the SDK's existing `hashObject` util (identical client+server); (4) primitive scalar → the value if unique, else `hash(value)+index`; (5) last resort index → still emit the key **plus a preview-visible diagnostic** that keys are unstable. Refinements vs the proposal: added the explicit-keyPath and scalar cases and pinned entry keying to id-not-revision.

### Correction 6 — transform registry: shared package + versioning (confirmed, strengthened)

Registry lives in the **same package as `BindingsResolver` (`@webiny/website-builder-sdk`)** — the one isomorphic core imported identically by the React/Vue/Next clients and the store-free server resolver, so client/server drift is impossible by construction. Make it **append-only, version-pinned by behaviour**: `registry.get(name, version)` with frozen semantics; the compiled template records the `registryVersion` it compiled against (written into `compiledPlan`, Q16); the resolver looks up transforms at the pinned version, so old templates keep producing identical output without forced recompile. Runtime guard: `compiled.registryVersion > registry.maxVersion` ⇒ fail-soft + logged (published) / visible diagnostic (preview). Enforcement is build-time version match (the WB skill already requires SDK version == Webiny version) + the runtime ceiling guard. Note the component-version scheme (Q30) is the sibling stamp on the same artefact.

---

## Section 8: Permissions

### Q34 — Separate design-system (template) from editorial (entry) actions

**Yes, cleanly — a dedicated gate is low-cost.** Permissions are schema-driven per package: `createPermissionSchema({ prefix, fullAccess, entities:[{ id, permission, scopes:["full"|"own"], actions:[{name:"rwd"},{name:"pw"}] }] })`, declared in both API (`api-core/.../permissions/createPermissionSchema.ts:3`, 27 callers, one per domain) and Admin (matching signature), compiled into a typed DI `Permissions` service (`canRead/canEdit/canPublish/onlyOwnRecords(entityId)`). CMS entry editing is gated by `cms.contentEntry` (names visible in `languages/.../AddCmsPermissions.ts:15-40`).

**Proposed gate:**

```ts
createPermissionSchema({
  prefix: "mt",
  fullAccess: true,
  entities: [
    {
      id: "template",
      permission: "mt.template",
      scopes: ["full", "own"],
      actions: [{ name: "rwd" }, { name: "pw" }]
    }
  ]
});
```

declared in both api + admin packages; template use-cases inject `MtPermissions` and check `canEdit("template")`, entry use-cases keep checking `cms.contentEntry` — orthogonal, so a design-system role holds `mt.template:rwd` + `cms.contentEntry:r` (the inverse of a normal editor). The `PermissionTransformer` seam (`AuthorizationContext`) can compose `mt.template` into the read-only CMS grants a template author needs.

### Q35 — Tenant scoping + cross-tenant hazards

**Tenant-scoped by default, enforced at the storage-key layer.** Every CMS entry's DDB partition key is `T#${tenant}#CMS#CME` and **throws if tenant is missing** (`api-headless-cms-ddb/src/operations/entry/keys.ts:7-13`); `KeyValueStore` forces `{ scope: tenant.id }` on every op (`api-core/.../keyValueStore/KeyValueStore.ts:16-27`). A template stored as a private CMS model (Q13) is tenant-partitioned by construction. **The only hazard is a compiled-artefact cache keyed without the tenant** — e.g. a process-level `Map<templateId, compiled>` surviving across warm-Lambda invocations that serve different tenants, or a shared CDN/object key without a tenant segment, or talking to the lower-level `GlobalKeyValueStore` directly (which is _not_ tenant-scoped; `KeyValueStore` is what prepends the scope). **Audit action:** any new compiled/cached artefact must key by `tenant.id` + id.

### Correction 8 — field-level permissions (the premise inverts)

**Webiny CMS field access rules are `FieldRule`s of `type:"accessControl"` evaluated CLIENT-SIDE in the Admin editor only.** The field "PermissionsEditor" offers two levels — "No Access" (`hide`) and "Viewer/Read-only" (`disable`) — targeting `admin:`/`team:` identities (`app-headless-cms/.../PermissionsEditor/FieldPermissionsSelection.tsx:7-18,121-136`), enforced by `FormModel.evaluateRules()` in-browser (`app-admin/.../formModel/FormModel.ts:100-133`). There is **no** delivery-side field stripper that reads `action:"hide"` and deletes the field from the API payload.

Consequences:

- **(a)** The entry payload returned to the editor still contains the field; hiding is presentational only.
- **(b)** The delivery/read API applies **none** of these rules (they target admin/team identities) — a public end-user gets the **full published field set**. So preview and production divergence comes from **editor-side hiding**, not delivery-side filtering.
- **(c)** Because the field is never actually removed from entry data, a template binding resolving **against the entry payload** does **not** hit a gap. Genuine absent-field cases are entry/model **permission-scope** denial (whole query fails, not a node), an unselected field, a `condition` rule, or a null value — all of which should **fail soft** (omit the node) like any unresolved binding.

**The premise inverts:** the real risk is an editor with a field hidden **in their form** authoring a binding they can't preview through the form, while production (and preview-against-raw-entry) shows it. → **Q37 product decision:** template preview should resolve against (1) the editor's client-side field-visibility view (fidelity to _their_ authoring) **or** (2) the full delivery field set (fidelity to _production_). They can't both hold; recommend **(2)** with an explicit "hidden-from-you" affordance on affected nodes. (Field-scope denial that _does_ remove data is server-enforced and correctly yields fail-soft nodes.)

---

## Standalone finding (OUT OF SCOPE for Model Templates) — unbounded document/entry store map

`DocumentStoreManager` (`website-builder-sdk/src/DocumentStoreManager.ts:4-27`) exports a **module-level singleton** `documentStoreManager` holding `private stores = new Map<string, DocumentStore>()`; `getStore(id)` lazily creates and **never evicts** (`removeStore` exists but is not called on the SSR/live path). `LiveSdk.getPage` writes into it every fetch. The CMS twin `entryStoreManager` (`cms-sdk/src/EntryStoreManager.ts`) is identical.

**Impact (pre-existing, independent of this feature):** any customer running WB pages in a **long-lived Node process** (SSR server, not per-invocation Lambda) accumulates one store per distinct page/entry id ever rendered, with no eviction → **unbounded memory growth**. Secondary: stores are process-global → no request isolation (mostly benign today because ids key identical static content, but a latent correctness hazard once per-request `state` is introduced).

**Suggested fix (one of):** (1) request-scoped stores created per render instead of a module singleton (cleanest); (2) LRU/size cap with eviction; (3) call `removeStore` after server render; (4) resolve store-free on the server.

**Scope:** OUT OF SCOPE for Model Templates and does **not** get fixed by shipping it. Noted because the template server resolver must **not** reuse this singleton — the stateless-resolver requirement (Section 2, Addition 1c) already avoids it.

---

## Section 9: Synthesis

### Q36 — Constraints the current platform cannot support (with the change each needs)

1. **`PropValue` tagged union + `BindingTrace` + `repeat` provenance + `diagnostics` + `mode`.** Resolver emits bare untyped values (`ResolvedElement.inputs: Record<string,any>`). → New resolver output format (additive but pervasive).
2. **`path` binding kind + parser + pure walker.** No restricted grammar exists; only `static|token|expression` (`new Function`). → New `ValueBinding.path`, AST, and resolver branch; `expression` forbidden in model-bound templates at publish.
3. **Path-based repeat + stable keys (Corrections 4/5).** `RepeatValueBinding` is `{ expression }`, index-only keys. → Type change to `{ path, keyPath? }` + key-derivation rule.
4. **Compiled template + fetch plan.** None exists. → New compile-on-publish handler + `compiledPlan` json field + `FetchPlanCollectionNode` for batched ref-list reads.
5. **`link` and `reference` producers.** No `link`/`reference` input types. → New input factories + renderers + `PropValue` producers (link in slice 1; reference later, server-mediated).
6. **Component `name@version` identity (Q30).** Identity is name-only everywhere. → `version` on manifest/element/registry.
7. **Unknown-component preview placeholder + `diagnostics` gating (Q31).** Today silent-skip + ungated warn. → Renderer placeholder branch keyed on preview mode; environment-gated diagnostics.
8. **Guaranteed image intrinsic dimensions (Q32).** Async/best-effort under `metadata.image`. → Promote to typed field or resolve-with-fallback at prop construction.
9. **Rich-text prop carries `{ state, html }` (Q33).** WB value is a bare state string. → Carry the pair.
10. **Stateless store-free server resolver.** Live render goes through the singleton store. → New pure `(compiledTemplate, entry, {locale, timeZone}) → ResolvedDocument` bypassing `documentStoreManager`.
11. **Explicit locale/timezone + deterministic formatters (Correction 7).** No content-locale in the new admin client; native `Intl` drift. → Content-locale context + resolver-context fields + shared deterministic formatters.
12. **Transform registry, shared + versioned (Correction 6).** None exists. → Append-only versioned registry in `website-builder-sdk`, `registryVersion` stamped on `compiledPlan`.
13. **Dependency index + blocking model-update guard (Q18–21).** No index, no field-change guard. → New private-model index + `ModelBeforeUpdateEvent` handler + advisory admin warning.
14. **Per-resolve content-status selector (Q29).** One global `preview` flag routes all reads. → template-version + per-read status as resolve params.
15. **Entry-level surrogate keys + tag invalidation (Q27).** TTL/path-only; managed CloudFront policies. → `ResolvedDocument.cache.tags` emission + a tag-invalidation mechanism at the edge.
16. **Batched entry read exposed to the resolver (Q28).** Batched by-id use cases exist; reference path is N+1 and single-id at the SDK. → Expose a grouped `getEntriesByIds` path to the fetch-plan resolver.
17. **Preview panel + field↔element wiring (Q22/Q23).** No panel slot; `focusField` exists but renderer highlight unconfirmed. → Compose-decorator panel + renderer highlight-on-`requestFocus`.
18. **Template-authoring permission gate (Q34).** Feasible as-is. → New `mt.template` schema (api + admin) — additive, no platform change.

### Q37 — Open questions for Sven (product, not technical)

1. **Field-level visibility in preview (Correction 8):** resolve against the editor's hidden-field view or the production/delivery field set? (Recommend production + "hidden-from-you" affordance.)
2. **Preview host below tenant (Addition 3c):** is per-tenant host selection sufficient, or must host vary per model/template? For migration tenants with **no frontend**, do we ship a Webiny-hosted preview with only default components, or require the customer's component set to be loaded — and where does that component set come from?
3. **Renderer target:** React only for slice 1, or React + Vue parity from the start? (Both renderers exist and share the core.)
4. **Rich text fidelity in preview:** render via the customer's theme typography (needs their theme/components) or Webiny's published theme when Webiny-hosted?
5. **Default-template authority:** who sets `model.settings.defaultTemplateId` — a design-system role or a content admin? Does a per-entry override require a distinct permission?
6. **Unpublished-template preview against live content (Q29 off-diagonal):** confirm this is a required authoring scenario (it drives the status-decoupling work).
7. **Transform whitelist scope:** confirm the initial transform set; each ICU-sensitive one needs a deterministic implementation.

### Q38 — Phasing (recommended first slice in bold)

- **Slice 1 (preview-only, single template per model, `path` scalar/asset/link/richText, no repeaters, no reference traversal):** Model Template private CMS model + `mt.template` gate; `path` grammar (field/index/transform, no `ref`) + parser + pure walker + shared versioned transform registry; `PropValue` tagged output + `BindingTrace` + `diagnostics` + `mode`; `link` input/producer; rich-text `{state,html}`; **client-side resolver in a preview iframe fed unsaved form state over postMessage** (reuse `cms-sdk` `EditingSdk` + `cms-nextjs` `EntryRenderer`); field↔element sync via `focusField(path)` + renderer highlight; content-locale context threaded into the resolver; **the store-free server resolver** for the published render path (shared pure function); compile-on-publish handler writing `compiledPlan` + `registryVersion`. Explicitly **not** in slice 1: repeaters, reference traversal, dependency index enforcement (build the index write-side, defer the blocking guard), surrogate-key invalidation, component versioning UI.
- **Slice 2:** repeaters (path-based `$repeat` + stable keys + `FetchPlanCollectionNode`), the batched grouped read, dependency-index blocking guard on model update + admin warning.
- **Slice 3:** reference traversal (depth ≤ 2) + `reference` producer + the client/server hybrid split; per-resolve content-status decoupling (four-state matrix); component `name@version`.
- **Slice 4:** entry-level surrogate keys + tag invalidation at the edge; Webiny-hosted preview surface for frontend-less migration tenants; Vue parity if required.

### Q39 — Findings that force a redesign vs. an adjustment (Sven's focus: §1, §2, §6)

**Redesign-forcing (structural):**

- **[§1/§2] `new Function` expression evaluator is incompatible** with the dependency index, the compiled fetch plan, publish-time type validation, and safe server eval → the **`path` grammar is mandatory** (accepted). Repeat sources inherit this (Correction 4).
- **[§2] Module-singleton document/entry stores are not request-isolated and never evict** → the **stateless store-free server resolver is mandatory** for migration/SEO; the singleton is a separate pre-existing defect.
- **[§6] One global `preview` flag routes every read to one endpoint** → the four-state matrix (esp. draft-template × published-entry) is **not expressible** without decoupling template-version from per-read content-status. Structural change to the resolve contract.
- **[§6] No cache-tag/surrogate-key infrastructure at all** → entry-level invalidation for resolved documents needs **net-new edge capability**, not a config tweak. If precise invalidation is a launch requirement, this is a redesign of the caching layer, not an adjustment.

**Adjustments (additive, no redesign):**

- `PropValue`/`BindingTrace`/provenance/diagnostics — pervasive but additive over a working resolver.
- Component `name@version`, unknown-component placeholder, image-dimension guarantee, rich-text `{state,html}` — localized additions.
- Template entity, publishing/versioning/rollback, compile-on-publish hook, permission gate, tenant scoping — all reuse existing platform mechanisms unchanged.
- Batched reads — the primitives exist; only a grouped entry point is missing.
- Preview panel, field↔element sync, secondary-entry editing — extension points and precedents already exist; content-locale threading is the one net-new wiring.
