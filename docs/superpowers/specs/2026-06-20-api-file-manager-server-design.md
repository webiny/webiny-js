# api-file-manager-server Design

## Purpose

A drop-in replacement for `api-file-manager-s3` that stores uploaded files on the local filesystem instead of AWS S3. The GraphQL API shape is identical — clients (frontend, SDK) work without changes.

## Constraints

- The GraphQL API shape MUST NOT change. All types, queries, and mutations match `api-file-manager-s3` exactly.
- Storage path MUST be explicitly configured via `WEBINY_LOCAL_STORAGE_PATH` environment variable. If missing, the server MUST fail to boot with a clear error message.
- Server URL for upload endpoints is resolved via `ServiceManifest` injection.

## Package: `packages/api-file-manager-server`

### Entry Point

```typescript
export const createFileManagerServer = () => [contextPlugin, createServerGraphQLSchema(), uploadRoutesPlugin];
export { createFileUploadModifier } from "./utils/FileUploadModifier.js";
export { createAssetDelivery } from "./assetDelivery/createAssetDelivery.js";
```

Same pattern as `createFileManagerS3()` — returns an array of plugins. The `uploadRoutesPlugin` is a single `RoutePlugin` that registers both the simple upload (`POST`) and multipart parts (`PUT`) endpoints. `createFileUploadModifier` and `createAssetDelivery` are re-exported for parity with the S3 package.

### Configuration

| Source | Key | Required | Purpose |
|--------|-----|----------|---------|
| Env var | `WEBINY_LOCAL_STORAGE_PATH` | Yes | Absolute path to the file storage directory |
| Env var | `WEBINY_UPLOAD_SECRET` | Yes | Secret key for HMAC-signing upload tokens |
| ServiceManifest | Server URL | Yes | Base URL for constructing upload endpoint URLs |

Boot validation: the `ContextPlugin` checks that `WEBINY_LOCAL_STORAGE_PATH` and `WEBINY_UPLOAD_SECRET` are set, and the storage directory exists (or can be created). If any check fails, it throws a descriptive error.

#### Server URL Resolution

The upload endpoint base URL is resolved from `ServiceManifest` via `ServiceDiscovery.load()`. The existing API manifest (registered by `createApiPulumiApp`) contains `cloudfront.domain` — the HTTPS URL fronting the API. The resolver reads it at runtime:

```typescript
const manifest = await ServiceDiscovery.load();
const baseUrl = manifest?.api?.cloudfront?.domain;
```

If the manifest is unavailable or the `cloudfront.domain` field is not set (e.g., local dev without Pulumi, or a non-CloudFront deployment), the resolver falls back to constructing the URL from the Fastify request: `${request.protocol}://${request.hostname}`. This ensures the package works in both deployed and local development contexts.

### File Storage Layout

```
{WEBINY_LOCAL_STORAGE_PATH}/
  tenants/
    {tenantId}/
      files/
        {fileId}/
          {sanitizedFileName}
      multipart/
        {uploadId}/
          part-1
          part-2
          ...
```

Same tenant-scoped structure as S3. Multipart upload parts are stored in a temporary directory until `completeMultiPartUpload` is called, at which point they are concatenated into the final file and the parts directory is removed.

## GraphQL Schema

Extends `FmQuery` and `FmMutation` with the same types defined by `api-file-manager-s3`:

### Types (identical to S3)

- `UploadFileResponseDataFile`
- `PreSignedPostPayloadInput`
- `GetPreSignedPostPayloadResponseDataFile`
- `GetPreSignedPostPayloadResponseData` — `data` field contains `{ url, fields }` (JSON)
- `GetPreSignedPostPayloadResponse`
- `GetPreSignedPostPayloadsResponse`
- `MultiPartUploadFilePart` — `url` points to local server instead of S3
- `CreateMultiPartUploadResponseData`
- `CreateMultiPartUploadResponse`
- `CompleteMultiPartUploadResponse`
- `MultiPartUploadFilePartInput` — defined for schema parity with S3; not referenced by any mutation argument in this implementation

### Queries

- `getPreSignedPostPayload(data: PreSignedPostPayloadInput!)` — returns upload URL + HMAC-signed token in `data.fields`. Resolves `GetSettingsUseCase` to read `uploadMinFileSize` / `uploadMaxFileSize` and embeds them in the token for server-side enforcement.
- `getPreSignedPostPayloads(data: [PreSignedPostPayloadInput]!)` — batch version

### Mutations

- `createMultiPartUpload(data: PreSignedPostPayloadInput!, numberOfParts: Number!)` — generates part upload URLs
- `completeMultiPartUpload(fileKey: String!, uploadId: String!)` — concatenates parts into final file

### Response Shape

The `data` field in `GetPreSignedPostPayloadResponseData` is typed as `JSON!`. For S3, this contains an AWS `PresignedPost` object (`{ url, fields }`). For the local server, it contains:

```json
{
  "url": "https://{serverUrl}/webiny-file-upload",
  "fields": {
    "key": "tenants/{tenantId}/files/{fileId}/{fileName}",
    "token": "{hmac-signed-token}"
  }
}
```

The frontend `SimpleUploadStrategy` creates a `FormData` from `fields`, appends the file, and POSTs to `url`. This works identically whether the URL points to S3 or the local server.

For multipart uploads, each `part.url` is:
```
https://{serverUrl}/webiny-file-upload/parts?uploadId={uploadId}&partNumber={n}&token={token}
```

## HTTP Upload Endpoints

Registered via `RoutePlugin` and `ModifyFastifyPlugin` (for `@fastify/multipart`).

### POST /webiny-file-upload

Accepts `multipart/form-data` with:
- `key` — the storage key (from `fields`)
- `token` — HMAC-signed upload token
- `file` — the file binary

Validation:
1. Verify HMAC token signature and expiry.
2. Enforce `uploadMinFileSize` / `uploadMaxFileSize` from the token payload against the actual uploaded file size. Reject with `400` if out of range.
3. Write file to `{WEBINY_LOCAL_STORAGE_PATH}/{key}`.
4. Return `204 No Content` on success (same as S3 presigned POST behavior).

### PUT /webiny-file-upload/parts

Accepts raw binary body (same as S3 presigned PUT for multipart parts).

Query parameters: `uploadId`, `partNumber`, `token`.

Validation:
1. Verify HMAC token.
2. Write chunk to `{WEBINY_LOCAL_STORAGE_PATH}/tenants/{tenantId}/multipart/{uploadId}/part-{partNumber}`.
3. Return `200 OK` with an `ETag` response header containing the MD5 hash of the chunk (matches S3 multipart PUT behavior). The current frontend does not read ETags, but including them ensures forward compatibility.

## Upload Token Security

HMAC-SHA256 signed tokens mirror S3 presigned URL security:

- **Payload**: `{ key, tenantId, expiresAt, uploadMinFileSize, uploadMaxFileSize }`
- **Secret**: `WEBINY_UPLOAD_SECRET` env var (required; boot fails if missing)
- **Expiry**: 60 seconds (same as S3 presigned default)
- **Validation**: verify signature, check `expiresAt > now`, match key against request

## DI Features

### GetFileContentsByIdFeature

Implements `GetFileContentsByIdUseCase` abstraction. Reads file metadata from `GlobalKeyValueStore` (same as S3), then reads the file from local disk using the `bucketKey` (which is the local path).

### GetFileContentsByKeyFeature

Implements `GetFileContentsByKeyUseCase` abstraction. Reads file directly from disk by constructing the full path from the tenant-scoped key.

### DeleteFileFromDiskFeature

Handles `FileAfterDeleteEvent`. Deletes the file directory from disk (`fs.rm(path, { recursive: true })`) and removes the metadata from `GlobalKeyValueStore`. Unlike the S3 version, no background task is needed — local filesystem deletion via `fs.rm` with `{ recursive: true }` is fast and does not require paginated iteration. The feature registers only the event handler, not a task definition.

### WriteFileMetadataFeature

Handles `FileAfterCreateEvent` and `FileAfterBatchCreateEvent`. Writes file metadata to `GlobalKeyValueStore`. The `bucketKey` value is the local path (`tenants/{tenantId}/files/{fileKey}`) — same format as S3.

### ExtractMetadataFeature

Handles `FileAfterCreateEvent`. Triggers a task that reads the file from local disk (instead of S3), extracts image metadata using `sharp` and `exifreader`, and updates the file record.

### FlushCacheFeature (noop)

Handles `FileAfterDeleteEvent` and `FileBeforeUpdateEvent` (matching the S3 package's event hooks exactly — the S3 version flushes cache _before_ the update so the CDN is invalidated before the record changes). The handlers exist with the correct signatures but perform no operation. This provides the integration point for future cache invalidation. No task definition is registered (unlike S3's `InvalidateCloudfrontCacheTaskDefinition`).

## Shared Code

The following utilities from `api-file-manager-s3` are not S3-specific and will be duplicated (or extracted into a shared location in a future refactor):

- `FileNormalizer` — generates unique file ID and key
- `FileKey` — constructs storage key from file data
- `MetadataWriter` / `MetadataReader` — key-value store operations for file metadata
- `mimeTypes` — MIME type resolution from file extension
- `checkPermissions` — file manager permission checks

## Asset Delivery

The `createAssetDelivery` export wires the full asset delivery feature pipeline — matching the S3 package's structure:

- `LocalContentsReader` — implements `AssetContentsReader`, reads file bytes from local disk via `fs.readFile()` instead of S3 `getObject`
- `LocalAssetResolver` — resolves asset keys to local file paths, implementing the same `AssetResolver` interface as the S3 version
- Output strategy and image transformation (via `sharp`) are provided by `@webiny/api-file-manager` and do not need local re-implementation

The `createAssetDelivery` factory returns the same plugin structure as the S3 package, making it a drop-in replacement for the asset delivery handler configuration.

## Package Dependencies

```json
{
  "dependencies": {
    "@webiny/api": "0.0.0",
    "@webiny/api-core": "0.0.0",
    "@webiny/api-file-manager": "0.0.0",
    "@webiny/background-tasks": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/handler": "0.0.0",
    "@webiny/handler-graphql": "0.0.0",
    "@webiny/plugins": "0.0.0",
    "@webiny/utils": "0.0.0",
    "@webiny/validation": "0.0.0",
    "@fastify/multipart": "^9.0.0",
    "exifreader": "^4.41.0",
    "mime": "^4.1.0",
    "p-map": "^7.0.4",
    "sanitize-filename": "^1.6.4",
    "sharp": "^0.35.1"
  }
}
```

Notable: no `@webiny/aws-sdk` dependency. The `@webiny/background-tasks` dependency is required for `ExtractMetadataFeature` (which triggers a background task) and for the `TaskController` context augmentation type import in `types.ts`.

## File Structure

```
packages/api-file-manager-server/
  src/
    index.ts                              # createFileManagerServer entry point + re-exports
    types.ts                              # shared types + background-tasks augmentation import
    graphql/
      schema.ts                           # GraphQL schema (same shape as S3)
    features/
      DeleteFileFromDisk/
        DeleteFileFromDiskHandler.ts
        feature.ts
      ExtractMetadata/
        ExtractMetadataHandler.ts
        ExtractMetadataTask.ts
        feature.ts
      FlushCache/
        FlushCacheOnFileDeleteHandler.ts   # noop
        FlushCacheOnFileBeforeUpdateHandler.ts  # noop (matches S3's FileBeforeUpdateEvent)
        feature.ts
      GetFileContentsById/
        GetFileContentsByIdUseCase.ts
        feature.ts
      GetFileContentsByKey/
        GetFileContentsByKeyUseCase.ts
        feature.ts
      WriteFileMetadata/
        MetadataWriter.ts
        MetadataReader.ts
        WriteMetadataAfterCreateHandler.ts
        WriteMetadataAfterBatchCreateHandler.ts
        feature.ts
    routes/
      uploadRoutes.ts                     # RoutePlugin registering POST + PUT endpoints
    utils/
      FileNormalizer.ts
      FileKey.ts
      FileUploadModifier.ts               # createFileUploadModifier (re-exported from index)
      mimeTypes.ts
      uploadToken.ts                      # HMAC token create/verify
      checkPermissions.ts
    assetDelivery/
      LocalContentsReader.ts
      createAssetDelivery.ts
  __tests__/
  package.json
  tsconfig.json
```
