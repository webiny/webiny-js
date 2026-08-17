# Proposal: Content Entry Input for the Website Builder

**Status:** Approved — in planning

**Author:** Sven

**Audience:** Engineering leadership / implementers

---

## 1. Summary

Add a new **Content Entry input type** to the Website Builder (WB) that lets a page editor either **hand-pick** one or more Headless CMS entries from a fixed content model, or **configure a dynamic query** against that model (sort / limit / search / pagination), and have the WB component render the resulting entries.

Data loading is abstracted behind an **`autoLoad`** flag: by default the framework resolves the input server-side and the component receives a ready-to-render list; opt out and the component gets the raw params and loads the data itself.

To reuse rendering logic across components we use **bridge components** — thin, typed containers that adapt a model's entries to a shared presentational renderer.

This unlocks the common "collection" use cases — product lists, blog listings, featured/related content, "last 10 products by price" — with a single reusable primitive.

---

## 2. Motivation

Today, surfacing CMS data in a WB page means hand-writing a Server Component that hard-codes the model, the query, and field access, with no first-class way for an editor to choose *which* entries appear or *how* they're ordered. We want:

- A first-class **entry input** an editor can drop into any component, scoped to a model.
- Both **curated** (editor hand-picks entries) and **query** (editor configures sort / limit / search on a fixed model) sourcing.
- **Server-side data loading by default**, so lists are in the server-rendered HTML (SEO), with the option for a component to load data itself when it needs full control.
- A clean **reuse** story via typed bridge components.

---

## 3. Goals / Non-goals

**Goals**

- `createContentEntryInput` primitive: author-fixed model, single or `list`, `mode: "manual" | "query"`.
- **Manual mode**: editor hand-picks entries; stored as **references** (`{ id, modelId }`).
- **Query mode**: editor configures the query in the sidebar — **sort** (editor chooses field + direction from a dev-declared list), **limit**, **search** (editor-configured term), **pagination** (`none` / `loadMore`).
- **`autoLoad`** data-loading abstraction (default `true`): framework resolves server-side and hands the component a list; `false` hands the component the params to load itself.
- A **bridge-component pattern** for reuse (shared presentational renderer + typed containers).

**Non-goals (this iteration)**

- **Input/selection validation** (`required` / `minLength` / `maxLength`). Deferred; when added it runs at the **component** level (`onChange` / programmatic component API), not the input level.
- **Editor-selectable model** (a generic listing where the editor picks *any* model). Deferred — the model is author-fixed; query mode locks to one model, which keeps typed props and avoids per-model template dispatch.
- **Declarative, data-driven field mapping** (dot-paths / transforms) — reuse is handled by bridge components in code.
- **Database-sourced manifests** — handled in a separate project.
- **Structured per-field filters** — v1 uses a single editor-configured search term instead.
- **Numbered / random-access pagination** — fights Webiny's cursor model (see §7).
- **Snapshotting entry data** into the page document — we store references / query specs; data stays live.

---

## 4. How the Website Builder works today (context)

WB is manifest-based. A component has a React implementation plus a **manifest** describing its inputs. Each input declares a `type` and a **renderer name**; the editor sidebar renders each input by looking that name up in a registry:

```
createTextInput(...)   -> { type: "text",   renderer: "Webiny/Input" }
createSelectInput(...) -> { type: "select", renderer: "Webiny/Select" }
```

The page document stores only **which component + input values**. Values are resolved at render and passed to the component via `props.inputs`. The actual React components live in the tenant's Next.js app (rendered in an iframe in the editor for true WYSIWYG).

**Implication:** a new input type is a triple — a **`type` keyword** + a **renderer name** + a **React renderer registered in the editor config**. This is exactly the extension point we use.

The CMS SDK surface we depend on (single unified SDK, `sdk.cms.{method}`):

- `sdk.cms.listEntries({ modelId, where, sort, limit, after, preview })` → `{ data, meta: { cursor, hasMoreItems, totalCount } }` — **cursor-based** pagination.
- `sdk.cms.getEntry(...)` / `sdk.cms.getModel(...)` for single lookups and model metadata.
- Existing CMS reference-picker infrastructure (autocomplete presenters + entry search use cases) that the editor renderer reuses.

---

## 5. Proposed solution

### 5.1 The new primitive: `createContentEntryInput`

A new WB input type scoped to an **author-fixed model**, with two modes and an `autoLoad` flag.

```ts
// Manual mode — editor hand-picks entries (stored as references)
createContentEntryInput({
  name: "items",
  models: ["product"],   // author-fixed
  list: true,            // single (omit/false) or multiple (true)
  autoLoad: true         // default — framework resolves server-side
});

// Query mode — editor configures a dynamic query on the fixed model
createContentEntryInput({
  name: "list",
  mode: "query",
  models: ["product"],
  query: {
    sort: { fields: ["price", "createdOn", "name"] }, // dev declares options; editor picks field + direction
    limit: { default: 10, max: 50 },
    search: true,          // editor-configured search term (v1)
    pagination: true       // none | loadMore
  },
  autoLoad: true
});
```

- **Editor side:** the `"Webiny/ContentEntry"` renderer branches on `mode` — manual shows the CMS reference autocomplete; query shows a query builder (sort field/direction, limit, search box, pagination toggle).
- **Stored value:** manual → references (`{ id, modelId }[]`); query → a query spec (`{ sort, limit, search }`; model known from config). No copies of entry data.

### 5.2 Data loading: `autoLoad`

The single knob that decides who loads the data. **Loading is always server-side** in both cases (SEO-safe) — `autoLoad` only decides *where the code lives*.

- **`autoLoad: true` (default)** — the framework resolves the stored value server-side (fetch-by-id for manual; `listEntries` for query) and passes the component a **ready list**. The component contains **no SDK code**.
- **`autoLoad: false`** — the component receives the **raw params** (references or query spec) and calls `sdk.cms.*` itself — for custom `where`, joins, post-processing, or bespoke fetch tuning.

**Typing is discriminated by the flag:**

```tsx
// autoLoad: true — component just renders a resolved list
function ProductListing({ inputs }: ComponentProps<{ items: CmsEntry<Product>[] }>) {
  return <EntryListing items={inputs.items.map(p => ({ heading: p.values.name, href: `/products/${p.id}` }))} />;
}

// autoLoad: false — component gets params and loads itself
async function ProductListing({ inputs }: ComponentProps<{ items: EntryQueryValue }>) {
  const res = await sdk.cms.listEntries<Product>({ modelId: "product", ...toQueryArgs(inputs.items) });
  return <EntryListing items={res.data.map(p => ({ heading: p.values.name, href: `/products/${p.id}` }))} />;
}
```

**Pagination interaction:** with `loadMore` + `autoLoad: true`, the framework hands the component the first page **plus** `pageInfo` (cursor / `hasMoreItems`) and a load-more handle — i.e. "a list *and a way to get more*", not a bare list. The load-more control is a small client boundary; page one is always server-rendered.

### 5.3 Reuse via bridge components

Render components stay **purely presentational** and typed. A **bridge** adapts a specific model's entries to the shared renderer's props — ordinary, fully-typed TypeScript (a renamed model field is a compile error, not a silent `undefined`):

```tsx
// EntryListing.tsx — shared presentational renderer (model-agnostic)
export interface EntryListingItem { heading: string; href?: string }
export function EntryListing({ items, title }: { items: EntryListingItem[]; title?: string }) { /* ... */ }
```

A `BlogListing` reuses the same `EntryListing` — only the bridge's mapping differs (`heading: b.values.title`). With `autoLoad: true` the bridge is trivial (map a resolved list); with `autoLoad: false` it also does the fetch.

---

## 6. Key design decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Author-fixed model** (manual and query) | Component knows the shape → typed props. Query mode locking to one model avoids model-picker + per-model template dispatch. |
| 2 | **Store references / query specs, not copies** | Data stays live; only published entries show on the live site. |
| 3 | **`autoLoad: true` by default, framework resolves server-side** | Lowest-boilerplate ergonomics (component gets a list) while keeping SEO; `autoLoad: false` preserves full control. |
| 4 | **Single + list in one input** via `list` flag | One primitive, two behaviors; consistent naming with the platform. |
| 5 | **Query controls editor-configured** (dev declares sort options, editor chooses) | Editors get "last 10 by price" without dev redeploys; dev still bounds what's sortable. |
| 6 | **Reuse via bridge components (code)** | Typed, simple; no data-mapping layer to build or maintain. |
| 7 | **Pagination: `none` + `loadMore` only** | Fits Webiny's cursor model; numbered/random-access is out (see §7). |

---

## 7. Constraints & risks

| Item | Detail | Mitigation |
|------|--------|------------|
| **`autoLoad` adds a core capability** | `autoLoad: true` requires the WB render pipeline to resolve `contentEntry` inputs server-side (couples WB render → CMS SDK / read key). | Scoped as a dedicated phase (§10); `autoLoad: false` is the escape hatch and needs no core resolution. |
| **Cursor-based pagination** | `after` + `meta.cursor` + `hasMoreItems`, not offset. `loadMore` fits; numbered / jump-to-page-N does not. | Ship `none` + `loadMore`. With `autoLoad: true`, expose `pageInfo` + load-more handle. |
| **Deep-item SEO** | Page one is always server-rendered (crawlable); items behind `loadMore` are fetched client-side and not crawled. | Acceptable for v1. If all items must be indexed, revisit URL-based pagination (deferred). |
| **Discriminated typing** | `inputs.<name>` is `CmsEntry[]` when `autoLoad: true`, references/query-spec when `false`. | Provide typed helpers so the component's props type follows the flag. |
| **Sort enum format** | Admin builds `values_<field>_ASC` (underscore); some docs show `values.<field>_ASC` (dot). | Verify against installed SDK (§9). |
| **`search` support** | Need to confirm `sdk.cms.listEntries` accepts a `search` arg vs. mapping into `where`. | Verify (§9). |
| **Broken / unpublished references** | May resolve to nothing. | Filtered out with graceful gaps; optional editor placeholder. |
| **Stable component names** | `name` is stored in page documents; renaming breaks existing pages. | Treat names as immutable identifiers. |
| **Validation deferred (future note)** | Not in v1. | When added, runs at the component level (`onChange` / programmatic API), not input level. |

---

## 8. Scope: Core framework vs. tenant app

**Core (Webiny framework — `packages/`)**

- `createContentEntryInput` factory + `ContentEntryInput` type in `website-builder-sdk` (`mode`, `models`, `list`, `query`, `autoLoad`).
- The `"Webiny/ContentEntry"` editor renderer: reference autocomplete (manual) + query builder (query) in `app-website-builder`.
- The **`autoLoad` resolver**: server-side resolution of the input value into entries in the render pipeline, including `pageInfo` for `loadMore`.

**Tenant app (Next.js starter)**

- Shared presentational renderers (e.g. `EntryListing`) and bridge components.
- The `autoLoad: false` self-load path (raw params + `sdk.cms.*`) and the `loadMore` client boundary.

---

## 9. Open items to verify before/at Phase 1

1. **`sdk.cms.listEntries` sort enum format** (`values_<field>_ASC` vs `values.<field>_ASC`).
2. **`sdk.cms.listEntries` `search` support** (dedicated arg vs. `where` mapping).

*(The earlier validation-gate item is closed: validation is out of v1; when introduced it uses the component-level `onChange` / programmatic API.)*

---

## 10. Implementation plan (phased)

| Phase | Scope | Estimate | Exit criteria |
|-------|-------|----------|---------------|
| **0 — Verification** | Confirm the two items in §9. | 0.5 day | Open items resolved. |
| **1 — Core primitive (manual)** | `createContentEntryInput` type + factory; `"Webiny/ContentEntry"` autocomplete renderer; single/`list`; store references. | 3–5 days | Editor can pick entries; value persists as references. |
| **2 — Bridge components + curated E2E** | `EntryListing` renderer + `ProductListing`/`BlogListing` bridges proving reuse (`autoLoad: false` path). | 2–3 days | Same renderer, two models, correct output. |
| **3 — Query mode + editor controls + pagination** | Query builder (sort from dev-declared fields, limit, search, pagination toggle); `sdk.cms.listEntries` wiring; `none` + `loadMore`. | 3–5 days | Editor configures "last 10 by price"; load-more works. |
| **4 — `autoLoad` framework resolution** | Server-side resolvable input: resolve references/query → entries and inject; `pageInfo` for `loadMore`; discriminated typing helpers. | 3–4 days | `autoLoad: true` components render with zero SDK code. |
| **5 — Docs, examples, hardening** | Starter-kit examples (both modes, both `autoLoad` values), authoring guide, edge cases. | 2 days | Documented and demoable. |

**Rough total:** ~14–19 engineering days, single developer. Estimates firm up after Phase 0. Phases 1–3 deliver the usable feature; Phase 4 (`autoLoad: true`) is the ergonomic/core upgrade and can ship as a fast-follow if needed.

---

## 11. Recommendation

Proceed. The design reuses proven infrastructure (WB manifest/input system, CMS reference autocomplete, CMS SDK pagination), isolates novelty into one primitive with two clear modes, keeps data loading server-side for SEO, and offers a low-boilerplate default (`autoLoad: true`) without giving up control (`autoLoad: false`). The two open items in §9 are small and do not put the architecture at risk.
