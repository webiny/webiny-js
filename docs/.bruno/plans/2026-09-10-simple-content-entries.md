# Simple content entries — implementation plan

**Status:** proposed
**Date:** 2026-09-10
**Design:** `docs/.bruno/2026-09-10-simple-content-entries-design.md`
**Spec:** `docs/.bruno/specs/2026-09-10-simple-content-entries.md`

Vertical slices. Phase 1 is a tracer bullet that reaches real storage; later phases widen that path
rather than adding a layer. No phase is done until its verification passes.

---

## Phase 0 — Cross-backend field audit — DONE (2026-09-10)

Results are in the design doc. Verdict: the eleven-field shape holds, no additions. The index-mapping
risk was withdrawn and replaced by a sort-field constraint, now enforced in the type.

**The only phase that can still change the design.** Everything after it assumes the eleven-field
shape is final, and that shape is currently verified against the DynamoDB backend only.

**Start with the search-backed backend.** OpenSearch is always present in the deployments this
targets, so audit `ddb-es` and `pg-os` first and the DynamoDB-only operations last. The unconditional
OpenSearch write (`DdbEsCreateEntry.ts:120-140`) is required behaviour here rather than a cost to
avoid — it is what makes get and list work — so the absent per-model opt-out
(`CmsModelOpenSearchIndexProvider.ts:5-9`) is a convenience.

For each backend, read the five implementations we ride (`Create`, `Update`, `Get`, `List`, `Delete`)
plus that backend's key and identifier helpers, and record every field read off the entry. Then read
the **index mapping**: a field the mapping expects and the shape omits fails at index time, not at
write time, so the write succeeds and the record simply never becomes searchable. That is the failure
this phase exists to prevent.

**Output:** a table appended to the design listing field → backend that reads it → file and line. No
field stays in the shape without one, except `createdOn` and `createdBy`, which are there by
requirement.

**Verification:** the audit accounts for every field, and any addition lands in `types.ts` and
`constants.ts` here and nowhere later.

---

## Phase 1 — Tracer bullet: create, to storage

Narrowest path that proves the design: one entry created through a use case, landing as two items.

**Files**

- `simpleContentEntries/types.ts`, `constants.ts`
- `simpleContentEntries/domain/errors/` — six error classes, one per file, plus `index.ts`
- `simpleContentEntries/entryDataFactories/createSimpleEntryData/` — abstraction, implementation,
  `feature.ts`, `index.ts`
- `simpleContentEntries/entryDataFactories/SimpleEntryDataFactoriesFeature.ts`
- `simpleContentEntries/createSimpleEntry/` — two abstractions, use case, repository, `feature.ts`,
  `index.ts`
- `simpleContentEntries/SimpleContentEntriesFeature.ts`
- Registration in `HeadlessCmsFeature.ts`

**Verification**

1. Factory unit test: exactly the eleven fields, all four pinned fields at their constants, `id`
   matching `<entryId>#0001`.
2. Integration test: create one entry, read the table directly, assert two items with `SK` of
   `REV#0001` and `L`, and that neither item's `data` carries any of the 26 dropped meta fields.
3. `WEBINY_STORAGE=sql yarn test packages/api-headless-cms 2>&1 | tail -50` green, and the
   integration test green under `yarn test:os`.

Assertion 2 is the point of the phase: it proves the reduced shape survives untouched storage
operations. Note that a storage-backed suite run **without** a storage flag silently skips and still
exits 0 — a green run with `920 skipped` is not a pass.

---

## Phase 2 — Read path

**Files:** `getSimpleEntry/` and `listSimpleEntries/` — two abstractions, use case, repository,
`feature.ts`, `index.ts` each. Registered in `SimpleContentEntriesFeature.ts`.

Use cases check `AccessControl` and publish no events, so there is no `EventPublisher` dependency
anywhere in this plan.

`getSimpleEntry` returns `Result<ISimpleCmsEntry, SimpleEntryNotFoundError>` and never `null`. It
prefers `GetLatestRevisionByEntryIdStorageOperation` for a pure id lookup, since that is data-loader
backed; `GetEntryStorageOperation` is also correct because reads are answered by the search backend.

**Verification:** create three entries, get each by id, list them back with a limit and a cursor,
assert the cursor round-trips and `hasMoreItems` is right at the boundary. Getting a missing entry
returns a `SimpleEntryNotFoundError` result rather than throwing or returning null. Run against the
search-backed configuration, since that is where get and list are answered.

---

## Phase 3 — Write path

**Files:** `entryDataFactories/updateSimpleEntryData/`, `updateSimpleEntry/`, `deleteSimpleEntry/`.

**Verification**

1. Update preserves `createdOn`, `createdBy`, `entryId` and the pinned four; only `values` changes.
   Assert against a table read, not just the returned object.
2. Update of a missing entry returns `SimpleEntryNotFoundError` and writes nothing.
3. Delete empties the entry's partition — assert no items remain under its `PK`.
4. Round trip: create → get → list → update → get → delete → get returns
   `SimpleEntryNotFoundError`.

---

## Phase 4 — CRUD surface and guards

The tag needs no type change: `CmsModel.tags` already exists (`types/model.ts:123`), and so does
`CmsModelCreateInput.tags` (`:228`).

**Files**

- `simpleContentEntries/domain/assertSimpleModel.ts` and `assertRegularModel.ts`
- `crud/simpleContentEntry.crud.ts` — the five `simple*` methods
- `assertSimpleModel` as the first statement of the five simple repositories
- `assertRegularModel` as the first statement of the twelve mutating regular repositories

The last item is the only change to existing code in this plan. Land all twelve in one commit — a
partial rollout leaves exactly the gaps the guard exists to close.

**Verification**

1. Each `simple*` method rejects an untagged model with `ModelNotSimpleError` and writes nothing.
2. One case per mutating regular repository: a tagged model is rejected, nothing is written. Twelve
   cases from a shared table, not twelve copies.
3. The ten read-only repositories still accept a tagged model — a simple entry stays readable through
   the regular get and list paths.
4. Round trip through the CRUD layer across all five methods on a tagged model.

---

## Phase 5 — Remaining backends

The search-backed configuration is exercised from Phase 1 onward. This phase covers the rest: run the
Phase 1–3 integration suites against each remaining configured backend.

**Verification:** identical assertions pass on each. Any divergence in ordering or pagination is a
defect in this feature, not a backend quirk to accommodate.

Note that CI selects test jobs by changed package, so a PR touching only `api-headless-cms` will not
run dependent suites. Comment `/vitest` on the PR to run the full matrix — "CI will catch it" is
false for cross-package behaviour.

---

## Per-phase checks

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
npx oxfmt packages/api-headless-cms
npx oxlint --fix packages/api-headless-cms
yarn format:check
yarn check -p @webiny/api-headless-cms
yarn build -p @webiny/api-headless-cms --safe-replace 2>&1 | tail -30
yarn webiny sync-dependencies
git add .
```

If any step fixes something, rerun from the top before committing. `yarn format` and `yarn lint` can
silently no-op with `command not found: oxfmt`, which is why the direct `npx` calls are used and
verified with a repo-wide `yarn format:check` — oxfmt formats markdown too, so a packages-only run
leaves `*.md` failing CI.

## Conventions this plan holds to

Per `webiny-api-architect` and `ai-context/code-style/`: camelCase feature directories named for
business capability, files named for technical responsibility; one abstraction per file under
`abstractions/` with a barrel; one class per file, so one error and one event per file; one exported
function per file; tokens namespaced `"Cms/SimpleEntry/<Name>"`; namespaces exporting `Interface`,
`Input`, `Error`, `Return`; errors extending `BaseError` with `override readonly code ... as const`;
use cases returning `Result` and never throwing or returning `null`; use cases transient,
repositories and factories singleton; implementation classes declared separately with `implements`;
`.js` on relative imports, `~` for internal absolute imports, one named import per line, comments
ending in a period; `index.ts` exporting abstractions only, via `export { }` and never `export *`.

## Sequencing note

Phases 1 through 3 depend only on Phase 0 and can start as soon as the shape is confirmed. Phase 4's
CRUD methods can land alongside them; only the outbound guard is coupled to existing code, and
nothing in the plan is blocked on an unanswered question.
