# @webiny/cms-nextjs

> Level 2 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/cms-nextjs` is a thin, Next.js/React-specific adapter over `@webiny/cms-sdk`: it re-exports the entire `cms-sdk` surface and adds a handful of client components/hooks (`EntryRenderer`, `EntryStoreProvider`, `ConnectToEntryEditor`, `DynamicZoneField`, `RefField`, `useEntry`, `createReactiveComponent`) that wire the SDK's mobx `EntryStore`/`RefCache`/`ComponentRegistry` into React context and mobx-react-lite's `observer`. It correctly delegates all data-fetching and ref-resolution logic to `cms-sdk` rather than reimplementing it. Overall health is fair: the package is tiny (8 files, no dead code, no jscpd duplication) but has zero tests, and two of its eight files have real, confirmable bugs — a race condition in the in-editor entry fetch, and a render-time store update that isn't guarded against re-running on every unrelated parent re-render.

## Public API
- `EntryRenderer`/`useComponents`/`useModel` (`src/EntryRenderer.tsx`) — the top-level wrapper that registers page components into `cms-sdk`'s `componentRegistry`, picks between the in-editor (`ConnectToEntryEditor`) and live (`EntryStoreProvider`) rendering paths based on `contentSdk.isEditing()`.
- `EntryStoreProvider`/`useEntryStore` (`src/EntryStoreProvider.tsx`) — binds a `cms-sdk` `EntryStore` (from `entryStoreManager`) into React context.
- `ConnectToEntryEditor` (`src/ConnectToEntryEditor.tsx`) — editor-mode variant that fetches the entry via `contentSdk.getEntry` before mounting `EntryStoreProvider`.
- `DynamicZoneField`/`RefField`/`useEntry`/`createReactiveComponent` (`src/DynamicZoneField.tsx`, `src/RefField.tsx`, `src/useEntry.ts`, `src/createReactiveComponent.ts`) — field-level rendering helpers built on `cms-sdk`'s `ComponentRegistry`/`ComponentResolver`/`refCache`, and a facade over `mobx-react-lite`'s `observer`.
- All of the above (plus the re-exported `cms-sdk` surface) are re-exported wholesale by `packages/sdk-nextjs/src/index.ts:3-14`, which is this package's only in-monorepo consumer — expected, since `cms-nextjs` is a public SDK layer meant for external Next.js consumer apps rather than for internal app packages.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|----------|----------------------|---------|-------------------|------------|
| 1 | medium | `packages/cms-nextjs/src/ConnectToEntryEditor.tsx:22-28` | The `useEffect` that calls `contentSdk.getEntry({ modelId, entryId })` has no guard against out-of-order responses: it unconditionally calls `setEntry(result)` in the `.then()` callback, with no check that `modelId`/`entryId` still match the latest render, and no cleanup/cancellation. | If `entryId` changes twice in quick succession (e.g. the visual editor swaps between two entries without a full component remount) and the first fetch resolves after the second one, `setEntry` is called with the stale (first) entry's data last, so the UI ends up showing the wrong entry until the next re-render. | medium |
| 2 | low | `packages/cms-nextjs/src/EntryStoreProvider.tsx:28-34` | `store.configure(storeConfig)` and `store.setEntry(entry)` are called unconditionally in the component body on every render, not only when `entryId`/`entry`/`storeConfig` actually change (no `useEffect`, no reference/content comparison). `EntryStore.setEntry` (`packages/cms-sdk/src/EntryStore.ts:30-43`) always does a mobx `Object.assign` merge and kicks off `resolveRefsLazy()` as a result. | Any re-render of `EntryStoreProvider`'s subtree caused by unrelated state (e.g. a sibling context value changing) re-runs the full entry merge and ref-resolution pass, even though the entry itself hasn't changed — unnecessary work on every render, and each call re-triggers `cms-sdk`'s ref-resolution path (already flagged in the `cms-sdk` level-1 report as having its own correctness/perf issue with repeatedly-resolved refs), compounding that cost. | medium |

## Duplication
None found — jscpd reports zero clones in this package, and the code does not reimplement anything already provided by `cms-sdk` (it consistently delegates to `contentSdk`, `entryStoreManager`, `componentRegistry`, `refCache`, `ComponentResolver`).

## Dead code
None found. Every exported symbol is re-exported by `packages/sdk-nextjs/src/index.ts`, which is the expected consumption path for a framework-integration package meant for use in generated/external Next.js projects.

## Convention issues
None found. Client components are consistently marked `"use client"`, DI/feature patterns from the backend code-style rules don't apply here (this is a pure React package), and context+hook pairs are co-located in a single file per the common React pattern (e.g. `EntryStoreContext`/`useEntryStore` in `EntryStoreProvider.tsx`), which is standard practice rather than a violation of "one exported function per file".

## Test gaps
- The package has no `__tests__` directory and no test files at all. In particular:
  - `ConnectToEntryEditor`'s fetch-and-set-state flow (including the race condition in Bug #1) is completely untested.
  - `EntryStoreProvider`'s render-time `configure`/`setEntry` calls (Bug #2) have no test verifying they don't re-run needlessly on unrelated re-renders.
  - `DynamicZoneField`/`RefField`'s resolution/rendering logic (dynamic-zone component resolution, ref-loading/ready states) has no coverage.

## Recommendations
1. Fix the race condition in `ConnectToEntryEditor.tsx` by ignoring stale responses (track the in-flight `modelId`/`entryId` and check it's still current before calling `setEntry`, or use an `AbortController`/effect-cleanup flag).
2. Guard the `store.configure`/`store.setEntry` calls in `EntryStoreProvider.tsx` behind a dependency check (e.g. move them into a `useEffect` keyed on `entryId`/`entry`/`storeConfig`, or compare against the store's current entry) so they only run when the entry actually changes.
3. Add basic component tests for `ConnectToEntryEditor` (fetch success/race) and `EntryStoreProvider` (store wiring), since the package currently has zero test coverage.
