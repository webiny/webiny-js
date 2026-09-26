# @webiny/api-headless-cms-aco

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-headless-cms-aco` is the glue package that makes generic CMS content models folder-aware for ACO: a CMS model modifier (`createCmsFolderModelModifier`) that namespaces folder fields onto arbitrary content models (with per-`modelId` field variants, unlike `api-file-manager-aco`'s single-model version), and one event handler, `SetLocationOnEntryRestore`, that fires on `EntryBeforeRestoreFromBinEventHandler` and resets a restored entry's `location.folderId` back to `ROOT_FOLDER` if the original folder no longer exists. Like `api-file-manager-aco`, this package contains no folder-level-permission (FLP) enforcement itself — that generic decoration lives in `@webiny/api-aco`'s CMS feature (audited at level 8) and applies uniformly to every folder-aware content model, including whichever ones this package's model modifier registers. Notably, `SetLocationOnEntryRestore` is this package's one hook directly on the restore-from-bin path, and it only handles a "folder was deleted" data-integrity edge case; see SEC-44 in private notes.

## Public API
- `AcoHcmsFeature` (`src/AcoHcmsFeature.ts:4`) — the package's DI feature; registers `SetLocationOnEntryRestoreFeature`. Sole production consumer: `packages/api-event-handler-core/src/registerApiRequestStack.ts`.
- `createCmsFolderModelModifier` (`src/plugins/createCmsFolderModelModifier.ts:44`) — builds a `FolderCmsModelModifierPlugin` that namespaces folder fields onto one or more content models (`modelIds`), analogous to `api-file-manager-aco`'s single-model modifier but generalized for arbitrary CMS models.
- `SetLocationOnEntryRestore` (`src/features/SetLocationOnEntryRestore/SetLocationOnEntryRestore.ts:5`) — implements `EntryBeforeRestoreFromBinEventHandler.Interface`; resolves the entry's folder via `GetFolderUseCase` and, if the folder no longer exists, resets `location.folderId` to `ROOT_FOLDER` before the restore completes. It performs no access-control check — it is purely a data-integrity fixup, and its existence does not compensate for the missing FLP decorator on the restore use case itself (tracked as SEC-44 in the `api-aco` report).
- `HcmsAcoContext` (`src/types.ts:5`) — a type-only union of `AcoContext`/`CmsContext`/`BaseContext`, used for typing handler signatures within this package.

## Bugs
None found in this package's own code. The restore-from-bin permission gap (SEC-44) originates in `@webiny/api-aco`, not here; this package's `SetLocationOnEntryRestore` handler runs on the same event but addresses an unrelated concern and does not itself introduce or fix the gap.

## Duplication
No jscpd clones reported for this package. `createCmsFolderModelModifier`'s `FolderModelFieldsModifier` class duplicates the shape (not the logic — it additionally handles multi-`modelId` fan-out) of `api-file-manager-aco`'s `FolderModelFieldsModifier`; both implement the same `IFolderModelFieldsModifier` interface with near-identical field-namespacing logic. This is an intentional per-consumer variant of a shared interface rather than accidental duplication, but a shared base implementation (e.g. a single-model wrapper built on top of the multi-model one) could remove the ~20 duplicated lines between the two packages.

## Dead code
None found — both DI features and the model modifier have live production consumers (traced above).

## Convention issues
None meaningful. One class/handler per file, DI naming matches the abstraction (`SetLocationOnEntryRestore` implements `EntryBeforeRestoreFromBinEventHandler.Interface`), barrel exports (`src/index.ts`) stay minimal.

## Test gaps
`__tests__/entries.hooks.test.ts` covers `SetLocationOnEntryRestore`'s folder-reset behavior (restoring into an existing vs. deleted folder). Add an integration test here once SEC-44 (private notes) is fixed in `api-aco`.

## Recommendations
1. No functional change needed in this package; the real fix belongs in `@webiny/api-aco` per SEC-44 (add a `RestoreEntryFromBinWithFlpDecorator`).
2. Once that decorator exists, add an integration test in this package's `entries.hooks.test.ts` (or a new `flp.restore.test.ts`) that restores an entry as a user without folder access, to confirm the fix covers generic CMS models (not just files) and to prevent regression.
3. Consider consolidating `FolderModelFieldsModifier` between this package and `api-file-manager-aco` into a single shared implementation, since the only real difference is single- vs multi-`modelId` field fan-out.
