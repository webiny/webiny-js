# Proposal: Content Entry Input for the Website Builder

**Status:** Approved — in planning

**Author:** Sven

**Audience:** Engineering leadership / implementers

---

## 1. Summary

Add a new **Content Entry input type** to the Website Builder (WB) that lets a page editor either **hand-pick** one or more Headless CMS entries from a fixed content model, or **configure a dynamic query** against that model (sort / limit / search / pagination), and have the WB component render the resulting entries.

Data loading is **always framework-resolved server-side** (SEO-safe): the component receives ready CMS entries via `props.inputs`. Query mode adds cursor-based `loadMore` through a small client hook.

To reuse rendering logic across components we use **bridge components** — thin, typed containers that adapt a model's entries to a shared presentational renderer.

This unlocks the common "collection" use cases — product lists, blog listings, featured/related content, "last 10 products by price" — with a single reusable primitive.

---

## 2. Motivation

Today, surfacing CMS data in a WB page means hand-writing a Server Component that hard-codes the model, the query, and field access, with no first-class way for an editor to choose _which_ entries appear or _how_ they're ordered. We want:

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
- **Server-side data loading** (always): the framework resolves the input into CMS entries and hands them to the component; query mode adds `loadMore` pagination via the `useContentEntryList` hook.
- A **bridge-component pattern** for reuse (shared presentational renderer + typed containers).

**Non-goals (this iteration)**

- **Input/selection validation** (`required` / `minLength` / `maxLength`). Deferred; when added it runs at the **component** level (`onChange` / programmatic component API), not the input level.
- **Editor-selectable model** (a generic listing where the editor picks _any_ model). Deferred — the model is author-fixed; query mode locks to one model, which keeps typed props and avoids per-model template dispatch.
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

- `sdk.cms.listEntries({ modelId, where, sort, limit, after, search, fields, preview })` → `{ data, meta: { cursor, hasMoreItems, totalCount } }` — **cursor-based** pagination. `sort` is `Record<fieldId, "asc"/"desc">` (single field), `search` is a native full-text term, and `fields` is required (`"values."`-prefixed).
- `sdk.cms.getEntry(...)` / `sdk.cms.getModel(...)` for single lookups and model metadata.
- Existing CMS reference-picker infrastructure (autocomplete presenters + entry search use cases) that the editor renderer reuses.

---

## 5. Proposed solution

### 5.1 The new primitive: `createContentEntryInput`

A new WB input type scoped to an **author-fixed model**, with two modes.

```ts
// Manual mode — editor hand-picks entries (stored as references)
createContentEntryInput({
  name: "items",
  models: ["blog"], // author-fixed
  list: true // single (omit/false) or multiple (true)
});

// Query mode — editor configures a dynamic query on the fixed model
createContentEntryInput({
  name: "list",
  mode: "query",
  models: ["blog"],
  query: {
    // Read-API sort keys (value fields as values_<fieldId>, meta bare) with optional labels.
    sort: { fields: [{ field: "values_title", label: "Title" }, "createdOn"] },
    limit: { default: 10, max: 50 },
    search: true, // editor-configured term; matches fullTextSearch-enabled fields
    pagination: true // enable loadMore
  }
});
```

- **Editor side:** the `"Webiny/ContentEntry"` renderer branches on `mode` — manual shows a search-and-add autocomplete with reorderable rows; query shows a query builder (sort field + segmented direction, limit with validation, search). One sort field → the picker is hidden and it sorts by default.
- **Stored value:** manual → references (`{ id, modelId }[]`); query → a query spec (`{ sort, limit, search }`; model known from config). No copies of entry data.
- **The framework always resolves** the stored value into CMS entries server-side (see §5.2). There is no `autoLoad:false` — a component that wants to fetch for itself just uses plain inputs for the params.

### 5.2 Data loading & pagination

The framework **always resolves** a content-entry input into CMS entries **server-side** (SEO-safe): fetch-by-id for manual, `listEntries` for query. The component receives ready entries via `props.inputs.<name>` — no SDK code for the common case. The page wires it once:

```tsx
// app/(site)/[slug]/page.tsx (RSC)
const resolvedContentEntries = page ? await resolveAutoLoad(page, componentManifests) : {};
return <DocumentRenderer document={page} resolvedContentEntries={resolvedContentEntries} />;
```

```tsx
// manual list → the component just renders resolved entries
function ProductListing({ inputs }: ComponentProps<{ items: CmsEntry<Product>[] }>) {
  return <EntryListing items={inputs.items.map(p => ({ heading: p.values.name }))} />;
}
```

**Pagination (query mode).** With `pagination: true`, the resolved value carries the first page **plus** the continuation query. The component uses the `useContentEntryList` hook to load more on demand:

```tsx
function ProductList({ inputs }: ComponentProps<{ list: ResolvedContentEntryQuery<Product> }>) {
  const { items, hasMore, loading, loadMore } = useContentEntryList(inputs.list);
  return (
    <>
      <ul>
        {items.map(p => (
          <li key={p.id}>{p.values.name}</li>
        ))}
      </ul>
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          Load more
        </button>
      )}
    </>
  );
}
```

The first page is server-rendered (in the HTML → SEO); `loadMore` fetches subsequent pages **client-side** via the cursor and appends. The hook re-seeds when the query changes (editor preview). Cursor-based only — no numbered pages, and deep pages aren't in the SSR HTML (not crawled).

### 5.3 Reuse via bridge components

Render components stay **purely presentational** and typed. A **bridge** adapts a specific model's entries to the shared renderer's props — ordinary, fully-typed TypeScript (a renamed model field is a compile error, not a silent `undefined`):

```tsx
// EntryListing.tsx — shared presentational renderer (model-agnostic)
export interface EntryListingItem {
  heading: string;
  href?: string;
}
export function EntryListing({ items, title }: { items: EntryListingItem[]; title?: string }) {
  /* ... */
}
```

A `BlogListing` reuses the same `EntryListing` — only the bridge's mapping differs (`heading: b.values.title`). The bridge just maps the framework-resolved entries to the renderer's props.

---

## 6. Key design decisions

| #   | Decision                                                                         | Rationale                                                                                                                   |
| --- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Author-fixed model** (manual and query)                                        | Component knows the shape → typed props. Query mode locking to one model avoids model-picker + per-model template dispatch. |
| 2   | **Store references / query specs, not copies**                                   | Data stays live; only published entries show on the live site.                                                              |
| 3   | **`autoLoad: true` by default, framework resolves server-side**                  | Lowest-boilerplate ergonomics (component gets a list) while keeping SEO; `autoLoad: false` preserves full control.          |
| 4   | **Single + list in one input** via `list` flag                                   | One primitive, two behaviors; consistent naming with the platform.                                                          |
| 5   | **Query controls editor-configured** (dev declares sort options, editor chooses) | Editors get "last 10 by price" without dev redeploys; dev still bounds what's sortable.                                     |
| 6   | **Reuse via bridge components (code)**                                           | Typed, simple; no data-mapping layer to build or maintain.                                                                  |
| 7   | **Pagination: `none` + `loadMore` only**                                         | Fits Webiny's cursor model; numbered/random-access is out (see §7).                                                         |

---

## 7. Constraints & risks

| Item                                  | Detail                                                                                                                                                                                                  | Mitigation                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **`autoLoad` adds a core capability** | `autoLoad: true` requires the WB render pipeline to resolve `contentEntry` inputs server-side (couples WB render → CMS SDK / read key).                                                                 | Scoped as a dedicated phase (§10); `autoLoad: false` is the escape hatch and needs no core resolution. |
| **Cursor-based pagination**           | `after` + `meta.cursor` + `hasMoreItems`, not offset. `loadMore` fits; numbered / jump-to-page-N does not.                                                                                              | Ship `none` + `loadMore`. With `autoLoad: true`, expose `pageInfo` + load-more handle.                 |
| **Deep-item SEO**                     | Page one is always server-rendered (crawlable); items behind `loadMore` are fetched client-side and not crawled.                                                                                        | Acceptable for v1. If all items must be indexed, revisit URL-based pagination (deferred).              |
| **Discriminated typing**              | `inputs.<name>` is `CmsEntry[]` when `autoLoad: true`, references/query-spec when `false`.                                                                                                              | Provide typed helpers so the component's props type follows the flag.                                  |
| **Sort shape (resolved)**             | `sdk.cms.listEntries` `sort` is `{ [fieldId]: "asc"/"desc" }` (e.g. `{ price: "desc" }`), bare field id — not the `values_…_ASC`/`values.…` forms. The read API converts it via `transformSortToArray`. | Pass the object form; **single sort field only** (storage throws on multiple).                         |
| **`search` (resolved)**               | Native `search?: string`, forwarded to the GraphQL read API — no `where` mapping.                                                                                                                       | Works only against fields with `fullTextSearch` enabled on the model — document this for editors.      |
| **Broken / unpublished references**   | May resolve to nothing.                                                                                                                                                                                 | Filtered out with graceful gaps; optional editor placeholder.                                          |
| **Stable component names**            | `name` is stored in page documents; renaming breaks existing pages.                                                                                                                                     | Treat names as immutable identifiers.                                                                  |
| **Validation deferred (future note)** | Not in v1.                                                                                                                                                                                              | When added, runs at the component level (`onChange` / programmatic API), not input level.              |

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

**Phase 0 — RESOLVED (verified against `next`, `packages/sdk` + `packages/api-headless-cms`):**

1. **Sort** — `sdk.cms.listEntries` takes `sort: Record<fieldId, "asc"/"desc">` (bare field id, e.g. `{ price: "desc" }`); the read API maps it via `transformSortToArray` (`{price:"desc"} → ["price_DESC"]`). **Single sort field only** — the storage layer throws `SORT_MULTIPLE_FIELDS_ERROR` on more than one. Neither the `values_<field>_ASC` nor the `values.<field>_ASC` form applies at the SDK layer.
2. **Search** — native `search?: string` on `sdk.cms.listEntries`, no `where` mapping needed. Matches only fields with `fullTextSearch` enabled on the model.

_(The earlier validation-gate item is closed: validation is out of v1; when introduced it uses the component-level `onChange` / programmatic API.)_

---

## 10. Implementation plan (phased)

| Phase                                             | Scope                                                                                                                                 | Estimate       | Exit criteria                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------- |
| **0 — Verification** ✅                           | Confirmed sort shape + native search against `next` (see §9).                                                                         | 0.5 day (done) | Sort = `{fieldId:"asc"/"desc"}`, single field; search native (fullTextSearch fields). |
| **1 — Core primitive (manual)** ✅                | `createContentEntryInput` type + factory; `"Webiny/ContentEntry"` autocomplete renderer; single/`list`; store references.             | 3–5 days       | Editor can pick entries; value persists as references.                                |
| **2 — Bridge components + curated E2E**           | `EntryListing` renderer + `ProductListing`/`BlogListing` bridges proving reuse (`autoLoad: false` path).                              | 2–3 days       | Same renderer, two models, correct output.                                            |
| **3 — Query mode + editor controls** ✅ (core)    | Query builder (sort from dev-declared fields, limit, search, pagination toggle); `sdk.cms.listEntries` wiring; `none` + `loadMore`.   | 3–5 days       | Editor configures "last 10 by price"; load-more works.                                |
| **4 — `autoLoad` framework resolution** ✅ (core) | Server-side resolvable input: resolve references/query → entries and inject; `pageInfo` for `loadMore`; discriminated typing helpers. | 3–4 days       | `autoLoad: true` components render with zero SDK code.                                |
| **5 — Docs, examples, hardening**                 | Starter-kit examples (both modes, both `autoLoad` values), authoring guide, edge cases.                                               | 2 days         | Documented and demoable.                                                              |

**Rough total:** ~14–19 engineering days, single developer. Estimates firm up after Phase 0. Phases 1–3 deliver the usable feature; Phase 4 (`autoLoad: true`) is the ergonomic/core upgrade and can ship as a fast-follow if needed.

**Progress (as-built):** Phases 0, 1, 3, 4 are implemented, unit-tested (the resolver), and committed on `claude/wb-content-entry-input` — typecheck/adio/format/lint clean. Beyond the original plan:

- **Manual mode** — single picker; multi = search-and-add autocomplete (clears on pick) + reorderable rows (move up/down/remove) with an empty state.
- **Query mode** — editor-configured sort (labelled options, segmented direction, field-picker hidden + default-sort for a single field), limit with inline validation (no silent clamping), search; a section header for the input.
- **Data loading** — always framework-resolved server-side (`resolveAutoLoad` in the RSC page → context → `LiveElementRenderer.onResolved`), with a client reactive cache for editor preview. The `autoLoad` flag was **removed** (autoLoad:false is redundant with plain inputs).
- **Pagination** — `useContentEntryList` hook: SSR first page + client `loadMore` via cursor; enabled by `query.pagination`.
- **Sort keys** — passed through verbatim (read-API format: `values_<fieldId>` / bare meta), documented; no auto-transform.

**Known limitations:** a `contentEntry` inside a **repeated element** shares one resolution key (not disambiguated per instance); `loadMore` pages are client-fetched (not in the SSR HTML → not crawlable); a **single sort field** is mandatory (always sorts). Editor-selectable model, structured filters, numbered pagination, validation, and DB-sourced manifests remain out of scope (§3). The read API's dot-vs-underscore sort inconsistency is parked (a separate core fix).

**Remaining:** pre-PR preflight (`sync-dependencies`, full test run) + open the PR; a live multi-mode smoke test in a running admin/site. Sample components live in the starter (branch `claude/content-entry-input-test`).

---

## 11. Recommendation

The design reuses proven infrastructure (WB manifest/input system, CMS reference autocomplete, CMS SDK pagination), isolates novelty into one primitive with two clear modes, keeps data loading server-side for SEO, and hands components ready entries (with a `useContentEntryList` hook for pagination). Implemented, tested, and committed; remaining work is packaging (PR + preflight) and a live smoke test.
