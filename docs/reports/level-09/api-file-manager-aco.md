# @webiny/api-file-manager-aco

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-file-manager-aco` is a small integration-glue package between `@webiny/api-file-manager` and `@webiny/api-aco`: it registers a CMS model modifier that adds a namespaced `location`/folder field to the `FmFile` content model, and an event handler (`EnsureFolderIsEmptyBeforeDelete`) that vetoes deleting a folder of type `FmFile` while it still contains files. It does not itself implement any folder-level-permission (FLP) enforcement — file operations (list/get/create/update) are gated by the same generic, model-agnostic `*WithFlpDecorator` set audited in `@webiny/api-aco` (level 8), since `FmFile` is just another CMS content model. This package's own `__tests__/flp.fm.test.ts` integration suite exercises and confirms that list/get/create are correctly folder-gated for files. The package has no restore-from-bin or move-file operations at all — file-manager does not expose a trash/restore or standalone "move" mutation — so the level-8 SEC-44 (`RestoreEntryFromBinUseCase` missing an FLP decorator) has no direct file-manager-specific instance to check today, though it would apply the moment such a mutation is added, since the decoration is generic across all CMS models.

## Public API
- `FileManagerAcoFeature` (`src/FileManagerAcoFeature.ts:4`) — the package's DI feature; registers `EnsureFolderIsEmptyBeforeDeleteFeature`. Sole production consumer: `packages/api-event-handler-core/src/registerApiRequestStack.ts`.
- `createFmFileFolderModelModifier` (`src/plugins/createFmFileFolderModelModifier.ts:34`) — builds a `FolderCmsModelModifierPlugin` that namespaces folder fields onto the `FmFile` model (prefixing field/storage ids with `fm_file_`) so file entries can carry `location.folderId` without colliding with other folder-aware models.
- `EnsureFolderIsEmptyBeforeDelete` (`src/features/EnsureFolderIsEmptyBeforeDelete/EnsureFolderIsEmptyBeforeDelete.ts:48`) — a `FolderBeforeDeleteEventHandler` implementation; only acts when `folder.type === "FmFile"`, using `ListFilesUseCase` (unfiltered by FLP, which is fine since it's an internal existence check inside an already-authorized folder-delete flow, not a data-exposing read) to check for any file in the folder before allowing deletion.

## Bugs
None found.

## Duplication
No jscpd clones reported for this package (all source files, including the two-line `feature.ts` wrappers, show 0 duplicated lines/tokens).

## Dead code
None found — both DI features and the model modifier have live production consumers (traced above).

## Convention issues
None meaningful. One class/implementation per file, DI naming matches the abstraction (`EnsureFolderIsEmptyBeforeDelete` implements `FolderBeforeDeleteEventHandler.Interface`), and the barrel (`src/index.ts`) only re-exports the feature and the model-modifier plugin factory — not internal DI wiring.

## Test gaps
`__tests__/flp.fm.test.ts` covers list/get/create-in-inaccessible-folder scenarios well, including a `test.todo` for "user without FM permissions" that is not yet implemented. There is no test anywhere in this package (or, per a repo-wide grep, in `api-file-manager`) for restoring a file from a trash bin or for a standalone "move file to folder" mutation, because neither operation exists yet in file-manager's GraphQL API — this is a coverage gap only in the sense that the moment such an operation is added, it needs an FLP decorator and a corresponding test from day one, mirroring the CMS-entry gap tracked as SEC-44.

## Recommendations
1. No functional changes needed today — the package is small, correctly scoped, and its FLP-relevant behavior (inherited generically from `api-aco`'s CMS decorators) is covered by its own integration tests.
2. When/if file-manager gains a restore-from-bin or standalone move-file mutation, ensure the generic decorator set in `api-aco` is extended to cover it (see SEC-44 in the `api-aco` report) before shipping, and add an `flp.fm.test.ts` case for it immediately.
3. Implement the existing `test.todo("as a user without FM permissions, I should not be able to CRUD files")` in `__tests__/flp.fm.test.ts` rather than leaving it pending.
