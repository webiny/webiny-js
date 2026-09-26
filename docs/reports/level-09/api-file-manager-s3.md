# @webiny/api-file-manager-s3

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-file-manager-s3` is the S3-backed storage implementation for `@webiny/api-file-manager`'s asset-delivery and upload abstractions: it signs presigned-POST/multipart uploads directly to S3, resolves/serves assets from a bucket (including a Sharp-based on-the-fly image transform/optimize/cache pipeline keyed by `tenants/<tenant>/files/...` object keys), wires GuardDuty-based threat-scanning (enterprise-gated), and flushes CDN cache on file update/delete. The package is generally consistent with the DI/use-case pattern used elsewhere, but it re-implements (rather than imports) `api-file-manager`'s upload-normalization utilities (`FileKey`, `FileNormalizer`, `FileExtension`, `mimeTypes`, `FileUploadModifier`) nearly verbatim, which also duplicates security finding SEC-47 (see private notes). Test coverage is thin: only `FileKey`'s sanitization and one metadata-write handler have unit tests; the presigned-upload signing, multipart upload/complete flow, and the entire Sharp transform/cache pipeline have none.

## Public API
- `FileManagerS3Feature` (`src/FileManagerS3Feature.ts`) — the DI feature that wires S3 asset delivery, file-operation handlers (flush cache, delete-from-bucket, extract metadata, write metadata, get-contents-by-id/-key), the `S3GraphQLSchema` resolvers (`getPreSignedPostPayload(s)`, `createMultiPartUpload`, `completeMultiPartUpload`), and the (enterprise) threat-scanning decorator. Consumed by project-level API composition (`project-aws`-style handlers) that opt into S3 storage instead of `api-file-manager-standalone`.
- `createAssetDelivery` (`src/assetDelivery/createAssetDelivery.ts`) — builds the S3 variant of the shared `AssetDelivery` abstractions (`S3AssetResolver`, `S3OutputStrategy`, `SharpTransform`/`LazySharpTransform`, `S3StreamAssetReply`/`S3RedirectAssetReply`/`S3ErrorAssetReply`) for the `/files/*` route.
- `createFileUploadModifier` (`src/utils/FileUploadModifier.ts`) — hook for customizing the file name/key just before signing; same shape as the one in `api-file-manager` (this package re-declares its own type rather than importing it).

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `packages/api-file-manager-s3/src/utils/FileKey.ts` | Security finding SEC-47 — see private notes. | — | high |
| 2 | low | `packages/api-file-manager-s3/src/enterprise/ApplyThreatScanning/CreateFileWithThreatScanDecorator.ts:15` | The decorator gates threat scanning on `FeatureFlags.get().isEnabled("fileManager.threatDetection")`, which (via `FeatureFlagsWithLicenseDecorator` in `api-core`) resolves to `wcp`'s `License.canUseFileManagerThreatDetection()`. That method (tracked separately in `docs/reports/level-00/wcp.md`, item 1) reads the nested `threatDetection` option without first checking the parent `fileManager.enabled` flag. | Confirmed this package is a live consumer of that gate: if a license payload ever has `fileManager.enabled: false` with a leftover `options.threatDetection: true`, this decorator will tag new files with `threatScanInProgress` and the GuardDuty pipeline will act on them for a tenant not entitled to the feature. Root cause and fix belong in `@webiny/wcp`, not here. | medium |

## Duplication
- `src/utils/FileKey.ts`, `FileNormalizer.ts`, `FileExtension.ts`, `mimeTypes.ts` are near-verbatim copies of the same-named files in `packages/api-file-manager/src/features/upload/utils/` (compared side-by-side; only import paths differ). This is cross-package duplication jscpd doesn't catch (single-package scans) but it means the shared normalization logic — and its known sanitization gap — is maintained in two places instead of one.
- No intra-package clones reported by jscpd (empty duplicate list).

## Dead code
- `WidthCollection` (`src/assetDelivery/s3/transformation/WidthCollection.ts`) has no consumers anywhere in the package — grepped for all references; only its own definition matches, and it is not re-exported from `src/index.ts`. Looks like a leftover from an earlier version of the resize-width-selection logic (the current `SharpTransform`/`AssetKeyGenerator` path takes `imageResizeWidths` straight into `SharpTransformer.transformBuffer` without going through this class).

## Convention issues
- `FileUploadModifier`'s type (`FileModifier`) and the whole upload-normalization set are one-abstraction-per-file already, but duplicating them from `api-file-manager` instead of importing violates the spirit of "reuse lower-level utilities" the audit is checking for; this is the same root cause as the Duplication finding above.

## Test gaps
- `__tests__/writeFileMetadata.test.ts` and `src/utils/FileKey.test.ts` are the only tests in the package. Untested: `getPresignedPostPayload` (including the `content-length-range`/`Content-Type` presigned-POST conditions), `CreateMultiPartUploadUseCase`/`CompleteMultiPartUploadUseCase` (no test exercises the multipart happy path, pagination in `getAllUploadParts`, or error handling), the entire `SharpTransform`/`optimizeAsset`/`transformAsset` cache-and-transform pipeline, `S3AssetResolver`, and the threat-scanning decorator/event handler chain (`processThreatScanResult`, `createThreatDetectionEventHandler`).
- No test asserts that a completed (or aborted) multipart upload with no matching `completeMultiPartUpload` call is ever cleaned up — see Recommendations.

## Recommendations
1. Add an S3 lifecycle-rule check or a scheduled cleanup task (mirroring `api-file-manager-standalone`'s `CleanupStaleMultipartUploadsTask`) for incomplete multipart uploads — nothing in this package aborts or expires an orphaned `createMultipartUpload` if `completeMultiPartUpload` is never called, so storage cost grows unbounded from abandoned/failed uploads. Currently there is no `AbortMultipartUploadCommand` anywhere in the package and no S3 bucket lifecycle configuration referenced.
2. Stop re-implementing `FileKey`/`FileNormalizer`/`FileExtension`/`mimeTypes` here; import them from `@webiny/api-file-manager` so the SEC-47 fix (tracked against the shared package) only needs to land once.
3. Add unit tests for `getPresignedPostPayload` (especially the `content-length-range` condition values) and the multipart upload/complete flow — currently the only tested unit is key sanitization.

## SEC-45/46/47 addendum: storage backends
See `docs/.reports/security.md` — "SEC-45/46/47 addendum: storage backends" section for how this backend mitigates or worsens each finding.
