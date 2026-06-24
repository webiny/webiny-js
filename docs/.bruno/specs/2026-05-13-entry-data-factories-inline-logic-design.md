# Entry Data Factories — Inline Logic Design

**Date:** 2026-05-13  
**Branch:** `bruno/feat/api-headless-cms/entry-data-factories`  
**Status:** Approved

## Goal

Eliminate `packages/api-headless-cms/src/crud/contentEntry/entryDataFactories/` entirely.
Move all logic into the DI factory implementations under `features/contentEntry/entryDataFactories/`.

## What Changes

### 1. Inline private helpers into each factory impl file

Each old function file contains private helpers used only by that one function.
Those helpers move into the corresponding factory impl file as module-scope functions.

| Factory impl file | Private helpers to inline |
|---|---|
| `CreateEntryDataFactory.ts` | `convertDefaultValue`, `getDefaultValue`, `cleanInputValues`, `createEntryId` |
| `UpdateEntryDataFactory.ts` | `createEntryMeta`, `transformEntryStatus` |
| `CreateEntryRevisionFromDataFactory.ts` | `increaseEntryIdVersion` |
| `CreatePublishEntryDataFactory.ts` | none |
| `CreateUnpublishEntryDataFactory.ts` | none |
| `CreateRepublishEntryDataFactory.ts` | none |

The old function's body becomes the `create()` method body directly (or a private method called from `create()`).
The `context`, `getIdentity`, `getTenant`, `accessControl` parameters are no longer passed as function args — they come from `this.xyzContext`.

### 2. Three shared files at the `entryDataFactories/` parent level

These are used across multiple factories and stay as named files:

| File | Exports | Used by |
|---|---|---|
| `statuses.ts` | `STATUS_DRAFT`, `STATUS_PUBLISHED`, `STATUS_UNPUBLISHED` | Create, CreateRevisionFrom, Publish, Unpublish |
| `system.ts` | `getSystem()` | Create, Update, CreateRevisionFrom |
| `mapAndCleanUpdatedInputData.ts` | `mapAndCleanUpdatedInputData()` | Update, CreateRevisionFrom, ValidateEntryUseCase |

These files are moved (not deleted) — their content stays identical, just their path changes from `crud/contentEntry/entryDataFactories/` to `features/contentEntry/entryDataFactories/`.

### 3. Update remaining direct importers of the old crud path

Six use cases and `ValidateEntryUseCase` still import directly from `crud/contentEntry/entryDataFactories/`.
Since we are deleting that folder, all these imports must be updated even though the use cases are not yet wired to inject factory tokens.

| File | Old import | New import |
|---|---|---|
| `CreateEntryUseCase.ts` | `~/crud/.../createEntryData.js` | `~/features/.../CreateEntryDataFactory/` (inline call removed when wired) |
| `UpdateEntryUseCase.ts` | `~/crud/.../createUpdateEntryData.js` | same pattern |
| `CreateEntryRevisionFromUseCase.ts` | `~/crud/.../index.js` | same pattern |
| `PublishEntryUseCase.ts` | `~/crud/.../index.js` | same pattern |
| `UnpublishEntryUseCase.ts` | `~/crud/.../index.js` | same pattern |
| `RepublishEntryUseCase.ts` | `~/crud/.../index.js` | same pattern |
| `ValidateEntryUseCase.ts` | `~/crud/.../index.js` | `~/features/contentEntry/entryDataFactories/mapAndCleanUpdatedInputData.js` |

For the 6 use cases: since the old functions are being inlined into the factory impls and are no longer exported, the use cases must stop calling the old functions and instead call the factory via the DI token. This makes this task and the "wire use cases" task the same work — they must be done together.

### 4. Delete old directory

Once all imports are updated and logic is inlined, delete `crud/contentEntry/entryDataFactories/` entirely (all 10 files).

## File Structure After

```
features/contentEntry/entryDataFactories/
  statuses.ts                               ← moved from crud/
  system.ts                                 ← moved from crud/
  mapAndCleanUpdatedInputData.ts            ← moved from crud/
  EntryDataFactoriesFeature.ts              ← unchanged
  CreateEntryDataFactory/
    abstractions.ts                         ← unchanged
    CreateEntryDataFactory.ts               ← logic inlined, no more crud/ import
    feature.ts                              ← unchanged
    index.ts                                ← unchanged
  UpdateEntryDataFactory/
    ...                                     ← same pattern
  CreateEntryRevisionFromDataFactory/
    ...
  CreatePublishEntryDataFactory/
    ...
  CreateUnpublishEntryDataFactory/
    ...
  CreateRepublishEntryDataFactory/
    ...
```

## Out of Scope

- Wiring the 6 use cases to inject factory tokens (separate task tracked in memory).
- Token scoping / renaming of use case tokens.
- Any changes to factory interfaces (`abstractions.ts` files).
