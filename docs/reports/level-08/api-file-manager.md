# @webiny/api-file-manager

> Level 8 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-file-manager` is the backend File Manager feature: a CMS-entry-backed `FmFile` domain model (create/update/delete/list/get, own/full permission scopes on top of `@webiny/api-headless-cms`'s `CreateEntryUseCase`/entry storage), a settings feature (min/max upload size, `srcPrefix`), a shared normalization layer for the pre-signed upload flow (`FileNormalizer`/`FileKey`/`FileExtension`/`mimeTypes`), and a DI-native `/files/*` (and `/private/*`) HTTP asset-delivery pipeline (request resolver → asset resolver → processor chain, with image resize/format/crop transforms via `sharp`, and public/private access-control + redirect strategies). Actual presigned-URL signing, storage-key tenant-prefixing, and object storage/reads are implemented in downstream packages (`api-file-manager-s3`, `api-file-manager-standalone`, etc.), not here. Overall the architecture is consistent (use-case/repository/DI-abstraction pattern throughout) and the "own vs full" permission scope is correctly double-checked (once up front, once against the fetched entity) for get/update/delete, matching the pattern used by `api-headless-cms`. The audit found three security findings tracked privately (SEC-45, SEC-46, SEC-47). Other packages should reuse this package's `FileNormalizer`/`FileKey`/`mimeTypes` for building upload keys rather than re-deriving filename/extension/MIME logic, and its `AssetRequestResolver`/`AssetProcessor`/`AssetOutputStrategy` DI abstractions for any new asset-delivery decorator, rather than parsing `/files/*` requests independently.

## Public API
- `GetFileUseCase` / `CreateFileUseCase` / `UpdateFileUseCase` / `DeleteFileUseCase` / `ListFilesUseCase` / `ListTagsUseCase` (`features/file/*`) — the CRUD facade wired into `FmGraphQLSchema.ts`'s resolvers; also consumed directly by `PrivateFilesAssetProcessor` (`GetFileUseCase`) and by `ai-powerups`/`api-file-manager-s3`/`api-file-manager-standalone` for content lookups.
- `AssetRequestResolver` / `AssetResolver` / `AssetProcessor` / `AssetOutputStrategy` / `AssetAuthorizer` (`features/assetDelivery/abstractions.ts`) — the DI abstractions the `/files/*` and `/private/*` HTTP routes are built from; `PrivateFileAssetRequestResolverDecorator` and `PrivateFilesAssetProcessorDecorator` are the only decorators registered when private files are licensed.
- `FileNormalizer` / `FileKey` / `FileExtension` / `mimeTypes` / `createFileNormalizerFromContext` (`features/upload/*`) — shared upload-key/MIME-resolution utilities; consumed by `api-file-manager-s3` and `api-file-manager-standalone` (each ships its own `createFileNormalizerFromContext`-equivalent wiring around the same `FileNormalizer`/`FileKey` classes) — see Bugs for a gap in this shared code.
- `GetUploadPayloadUseCase` / `CreateMultiPartUploadUseCase` / `CompleteMultiPartUploadUseCase` (`features/upload/*`) — abstractions only; concrete presigned-URL implementations live entirely in downstream storage packages (out of this audit's scope), ~2-3 implementations each (`api-file-manager-s3`, `api-file-manager-standalone`).
- `FmPermissions` / `FM_PERMISSIONS_SCHEMA` (`features/permissions/*`, `domain/permissionsSchema.ts`) — the `fm.file` (full/own scopes, rwd actions) and `fm.settings` (full scope) permission schema, consumed across every use case in `features/file/*` and `features/settings/*`.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|----------|----------|---------|-------------------|------------|
| 1 | high | packages/api-file-manager/src/domain/file/file.model.ts | Security finding SEC-45 — see private notes. | — | high |
| 2 | medium | packages/api-file-manager/src/features/file/CreateFile/CreateFileUseCase.ts | Security finding SEC-46 — see private notes. | — | high |
| 3 | medium | packages/api-file-manager/src/features/upload/utils/FileKey.ts | Security finding SEC-47 — see private notes. | — | medium |
| 4 | low | packages/api-file-manager/src/domain/settings/validation.ts | `uploadMinFileSizeValidation`/`uploadMaxFileSizeValidation` each validate their own bound independently (`min >= 0`, `max <= 10GB`) but there is no cross-field check that the resulting `uploadMinFileSize <= uploadMaxFileSize`. | An admin (via `updateSettings`, `fm.settings` permission) sets `uploadMinFileSize` higher than `uploadMaxFileSize`. `CreateFileUseCase.validateInput`'s check `input.size < min \|\| input.size > max` then rejects every upload regardless of size, since no size can satisfy both bounds — a self-inflicted denial of the upload feature until an admin corrects the settings. | high |

## Duplication
jscpd found 9 clones (1.91% of lines) entirely within the package, all small and structural rather than copy-paste sloppiness:
- `features/assetDelivery/assetTypes/image/transformImage.ts:99-105` and `:197-203` (and `:115-123`/`:209-217`) — `cropImageBuffer` and `extractFramedRegion` both open the buffer with `sharp()`, read `metadata()`, and clamp/extract a region with near-identical bounds-checking arithmetic. Worth factoring into one shared "load + get dimensions + extract rect" helper.
- `features/file/shared/FileInputToEntryInputMapper.ts:7-21` / `FileToEntryMapper.ts:8-...` — the two entry-mapping directions share the same field-list shape.
- `features/file/GetFile/GetFileRepository.ts:21-36` / `CreateFile/CreateFileRepository.ts:24-36` / `UpdateFile/UpdateFileRepository.ts:29-...` — the CMS-entry-to-domain-error mapping (`Cms/Entry/NotAuthorized` → `FileNotAuthorizedError`, etc.) is repeated per repository instead of extracted into a shared mapper.
- `features/file/CreateFile/CreateFileUseCase.ts:80-105` / `CreateFilesInBatch/CreateFilesInBatchUseCase.ts:72-90` — the single-file and batch create paths duplicate the same file-input assembly logic.
- `features/assetDelivery/privateFiles/RedirectToPrivateUrlOutputStrategy.ts:7-20` / `RedirectToPublicUrlOutputStrategy.ts:7-...` and `PrivateCache.ts:6-19` / `PublicCache.ts:6-...` — intentionally mirror-image pairs (private vs. public variant of the same strategy); low-risk structural duplication, reasonable to leave as-is for readability but a shared base class would remove it.

No duplication of lower-level package utilities was found — the package correctly uses `@webiny/api-headless-cms`'s `CreateEntryUseCase`/entry storage rather than reimplementing CRUD, and its own `FileNormalizer`/`mimeTypes` are the canonical helpers other packages import rather than re-derive.

## Dead code
None found with high confidence. `GetFileContentsByIdUseCase`/`GetFileContentsByKeyUseCase` and `GetFileByUrlUseCase` are abstraction-only exports in this package but have confirmed real consumers downstream (codegraph: `GetFileByUrlUseCase` — 5 callers including `FmGraphQLSchema.ts`; `GetFileContentsByIdUseCase` implementations — 8 callers across `ai-powerups` and the storage-specific packages), so they are not dead despite having no implementation in this package itself (by design — implementations are per storage backend).

## Convention issues
No significant violations found. The package consistently follows the DI abstraction/implementation split (one `abstractions.ts` + implementation file per feature folder), namespace types are used for the public generic types (e.g. `GetUploadPayloadUseCase.Interface`), and the barrel exports (`src/index.ts`, `features/upload/index.ts`) only re-export what downstream storage packages and the admin app actually consume.

## Test gaps
- The upload-key/normalization layer (`FileNormalizer`, `FileKey`, `FileExtension`, `mimeTypes`) has zero dedicated unit tests (codegraph found none within 3 caller hops of `FileNormalizer`); this is exactly the code path implicated in Bugs #1 and #3, so a test asserting that a disallowed `type` (e.g. `text/html`) or a `keyPrefix`/`id` containing `../` is rejected or sanitized would have caught both.
- `CreateFileUseCase.validateInput`'s min/max size check (Bug #4's counterpart) has no test covering `uploadMinFileSize > uploadMaxFileSize`, nor one asserting that `input.size` is the only signal checked (i.e. no test documents/guards against the metadata-only nature of the check in Bug #2).
- Asset delivery has decent coverage of the image-transform math (`crop.test.ts`, `imageFormat.test.ts`, `normalizeImageOptions.test.ts`) but no test exercises the `PrivateFilesAssetProcessor`/`PrivateAuthenticatedAuthorizer` authorization path or the public/private redirect strategies end-to-end.

## Recommendations
1. Address security findings SEC-45 and SEC-46 (see private notes).
2. Treat `input.size` as untrusted in `CreateFileUseCase` — either verify it against the real stored-object size via the storage layer, or document/enforce that every `GetUploadPayloadUseCase` implementation must apply an equivalent server-side size constraint at signing time (Bug #2).
3. Address security finding SEC-47 (see private notes).
