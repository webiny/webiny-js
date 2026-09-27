# @webiny/api-file-manager-standalone

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-file-manager-standalone` is the local-disk storage implementation for `@webiny/api-file-manager`, used by self-hosted (non-AWS-Lambda) deployments: it signs HMAC-based upload tokens instead of S3 presigned POSTs, exposes its own bare-bones multipart-form-data upload route (`/webiny-file-upload`) and a chunked upload-part route, stores file bytes under `<storagePath>/tenants/<tenant>/files/...`, and reuses the shared package's asset-delivery abstractions with a `LocalAssetResolver`/`LocalContentsReader`/local Sharp transform. Unlike `api-file-manager-s3`, this package correctly delegates upload normalization (`FileKey`/`FileNormalizer`) to `@webiny/api-file-manager` rather than re-implementing it; security finding SEC-51 applies (see private notes).

## Public API
- `FileManagerStandaloneFeature` (`src/FileManagerStandaloneFeature.ts`) — the DI feature wiring local asset delivery, upload routes, multipart-upload use cases, the stale-multipart-upload cleanup task, and the `StandaloneGraphQLSchema` resolvers. Used by self-hosted API composition roots as the alternative to `api-file-manager-s3`.
- `createAssetDelivery` (`src/assetDelivery/createAssetDelivery.ts`) — local-disk variant of the shared asset-delivery abstractions (`LocalAssetResolver`, `LocalOutputStrategy`, `LocalSharpTransform`/`LazyLocalSharpTransform`).
- `createFileUploadModifier` — re-exported directly from `@webiny/api-file-manager` (no local re-implementation, unlike the S3 package).
- `UploadSingleFileRoute` / `UploadPartRoute` (`src/routes/*`) — the HTTP endpoints a client's browser/SDK actually POSTs bytes to once it has a signed upload token from `GetUploadPayloadUseCase`.

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `packages/api-file-manager-standalone/src/features/GetFileContentsByKey/GetFileContentsByKeyUseCase.ts` | Security finding SEC-51 — see private notes. | — | high |
| 2 | medium | `packages/api-file-manager-standalone/src/features/GetFileContentsById/GetFileContentsByIdUseCase.ts` | Security finding SEC-51 — see private notes. | — | medium |
| 3 | low | `packages/api-file-manager-standalone/src/assetDelivery/LocalContentsReader.ts` | Security finding SEC-51 — see private notes. | — | medium |

## Duplication
- jscpd reports three intra-package clones: `routes/UploadPartRoute/UploadPartRoute.ts:9-16`/`27-39` against `routes/UploadSingleFileRoute/UploadSingleFileRoute.ts:8`/`34` (the token-verification and boundary-parsing boilerplate is copy-pasted between the two upload routes rather than shared), and `graphql/StandaloneGraphQLSchema.ts:122-136` against `:155-170` (near-identical resolver bodies for the single-part vs. multi-part payload GraphQL fields).
- `GetFileContentsByIdUseCase`/`GetFileContentsByKeyUseCase` both re-derive the local file path independently rather than sharing one "resolve local file path" helper (see also SEC-51 in private notes).
- `GetFileContentsByKeyUseCase.ts`'s `CONTENT_TYPE_MAP`/`resolveContentType` duplicates the extension→MIME-type mapping already provided by `@webiny/api-file-manager`'s/`api-file-manager-s3`'s `mimeTypes.ts`, with a different (larger, hand-rolled) set of extensions.

## Dead code
None found with confirmed reachability; `CleanupStaleMultipartUploadsFeature`/`CleanupStaleMultipartUploadsTaskDefinition` is registered from `FileManagerStandaloneFeature.ts:54`, so it is wired even though nothing in this package itself triggers it on a schedule (relies on `api-core`'s task scheduler, out of scope here).

## Convention issues
- `GetFileContentsByKeyUseCase.ts` and `GetFileContentsByIdUseCase.ts` inline a `Record<string, string>`-shaped content-type map and a local `AssetMetadata` interface (`LocalAssetResolver.ts:10-16`) rather than extracting named types to their own files, contrary to the "no inline types" convention.

## Test gaps
- `__tests__/uploadRoutes.test.ts`, `uploadToken.test.ts`, `completeMultiPartUpload.test.ts`, `getFileContents.test.ts`, and `roundTrip.test.ts` give this package noticeably better coverage than `api-file-manager-s3`. A regression test is needed for security finding SEC-51 — see private notes.
- No test covers `CleanupStaleMultipartUploadsTask`'s age-threshold deletion logic.

## Recommendations
1. Address security finding SEC-51 (see private notes).
2. De-duplicate `UploadPartRoute`/`UploadSingleFileRoute`'s shared token-verification/multipart-parsing boilerplate, and the two near-identical resolver bodies in `StandaloneGraphQLSchema.ts`, into one helper each.
3. Replace `GetFileContentsByKeyUseCase`'s hand-rolled `CONTENT_TYPE_MAP` with the shared `mimeTypes` table (also relevant to SEC-45, see private notes).

## SEC-45/46/47 addendum: storage backends
See `docs/.reports/security.md` — "SEC-45/46/47 addendum: storage backends" section for how this backend mitigates or worsens each finding.
