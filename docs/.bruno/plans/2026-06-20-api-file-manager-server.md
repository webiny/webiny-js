# api-file-manager-server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `@webiny/api-file-manager-server`, a drop-in replacement for `@webiny/api-file-manager-s3` that stores uploaded files on local disk instead of AWS S3.

**Architecture:** Mirrors `api-file-manager-s3` — same GraphQL schema, same DI feature pattern, same event handler wiring. Replaces S3 operations with `node:fs/promises`, presigned S3 URLs with HMAC-SHA256 upload tokens, and S3 lifecycle policies with a background cleanup task.

**Tech Stack:** TypeScript, Fastify, `@fastify/multipart`, `node:crypto`, `node:fs/promises`, `sharp`, `exifreader`, `vitest`

**Reference package:** `packages/api-file-manager-s3` — the template for all duplicated code.

## Global Constraints

- ES modules only — no CommonJS
- One class per file, one named import per line, named exports only
- `Impl` suffix on implementation classes; export const matches abstraction name
- `/* */` comments, never `/** */`; `public`/`protected`/`private` + `readonly` on class properties
- Feature names: `FileManagerServer/` prefix (not `FileManagerS3/`)
- `FileUploadModifierPlugin.type` = `"fm.server.uploadModifier"` (not `"fm.s3.uploadModifier"`)
- `WEBINY_LOCAL_STORAGE_PATH` + `WEBINY_UPLOAD_SECRET` required env vars — boot fails if missing
- No `@webiny/aws-sdk` dependency
- GraphQL API shape identical to `api-file-manager-s3`

## Template rule

Many files are near-identical copies from `api-file-manager-s3`. When a step says **"adapt from S3"**, copy the S3 file and apply only the listed changes. Read the S3 source first — do not write from memory.

---

### Task 1: Package scaffolding + utility files + upload token

**Goal:** Create the package structure and all shared utilities that other tasks depend on.

**Files to create** (all under `packages/api-file-manager-server/`):

| File | Source |
|------|--------|
| `package.json` | Adapt from S3. Remove `@webiny/aws-sdk`, `@webiny/handler-aws`, `@webiny/api-websockets`, `object-hash`. Add `@fastify/multipart: ^9.0.0`. Keep `object-hash` (asset delivery uses it). |
| `tsconfig.json` | Adapt from S3. Remove aws-sdk, handler-aws, api-websockets references. |
| `tsconfig.build.json` | Same as tsconfig.json adaptations. |
| `src/types.ts` | Adapt from S3. Remove `PresignedPost` import from aws-sdk. Add `LocalPresignedPostData` and `UploadTokenPayload` interfaces. Keep background-tasks augmentation import. |
| `src/utils/mimeTypes.ts` | Copy from S3 verbatim. |
| `src/utils/FileExtension.ts` | Copy from S3 verbatim. |
| `src/utils/FileKey.ts` | Copy from S3 verbatim. |
| `src/utils/FileKey.test.ts` | Copy from S3 verbatim. |
| `src/utils/FileNormalizer.ts` | Copy from S3 verbatim. |
| `src/utils/FileUploadModifier.ts` | Adapt from S3. Change `type` to `"fm.server.uploadModifier"`. |
| `src/utils/checkPermissions.ts` | Copy from S3's `graphql/checkPermissions.ts` verbatim. |
| `src/utils/createFileNormalizerFromContext.ts` | Copy from S3 verbatim. |
| `src/utils/uploadToken.ts` | **New.** See code below. |
| `src/utils/resolveServerUrl.ts` | **New.** See code below. |

**New types** in `src/types.ts` (add alongside adapted types):

```typescript
export interface LocalPresignedPostData {
    url: string;
    fields: {
        key: string;
        token: string;
    };
}

export interface UploadTokenPayload {
    key: string;
    tenantId: string;
    expiresAt: number;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
}
```

**New file** `src/utils/uploadToken.ts`:

```typescript
import { createHmac } from "node:crypto";
import type { UploadTokenPayload } from "~/types.js";

export const createUploadToken = (payload: UploadTokenPayload, secret: string): string => {
    const json = JSON.stringify(payload);
    const encoded = Buffer.from(json).toString("base64url");
    const signature = createHmac("sha256", secret)
        .update(encoded)
        .digest("base64url");

    return `${encoded}.${signature}`;
};

export const verifyUploadToken = (token: string, secret: string): UploadTokenPayload => {
    const dotIndex = token.indexOf(".");
    if (dotIndex === -1) {
        throw new Error("Invalid token format.");
    }

    const encoded = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);

    const expectedSignature = createHmac("sha256", secret)
        .update(encoded)
        .digest("base64url");

    if (signature !== expectedSignature) {
        throw new Error("Invalid token signature.");
    }

    const json = Buffer.from(encoded, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as UploadTokenPayload;

    if (payload.expiresAt < Date.now()) {
        throw new Error("Token has expired.");
    }

    return payload;
};
```

**New file** `src/utils/resolveServerUrl.ts`:

```typescript
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/ServiceDiscovery.js";
import type { FastifyRequest } from "fastify";

export const resolveServerUrl = async (request: FastifyRequest): Promise<string> => {
    const manifest = await ServiceDiscovery.load();
    const domain = manifest?.api?.cloudfront?.domain;
    if (domain) {
        return domain as string;
    }

    return `${request.protocol}://${request.hostname}`;
};
```

**Test** `__tests__/uploadToken.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createUploadToken, verifyUploadToken } from "~/utils/uploadToken.js";
import type { UploadTokenPayload } from "~/types.js";

const SECRET = "test-secret-key-for-hmac";

const makePayload = (overrides: Partial<UploadTokenPayload> = {}): UploadTokenPayload => ({
    key: "tenants/t1/files/abc123/image.jpg",
    tenantId: "t1",
    expiresAt: Date.now() + 60_000,
    uploadMinFileSize: 0,
    uploadMaxFileSize: 1_099_511_627_776,
    ...overrides
});

describe("uploadToken", () => {
    it("should create and verify a valid token", () => {
        const payload = makePayload();
        const token = createUploadToken(payload, SECRET);
        const result = verifyUploadToken(token, SECRET);
        expect(result.key).toEqual(payload.key);
        expect(result.tenantId).toEqual(payload.tenantId);
    });

    it("should reject a token with wrong secret", () => {
        const token = createUploadToken(makePayload(), SECRET);
        expect(() => verifyUploadToken(token, "wrong")).toThrow("Invalid token signature.");
    });

    it("should reject a tampered token", () => {
        const token = createUploadToken(makePayload(), SECRET);
        expect(() => verifyUploadToken(token + "x", SECRET)).toThrow("Invalid token signature.");
    });

    it("should reject an expired token", () => {
        const token = createUploadToken(makePayload({ expiresAt: Date.now() - 1000 }), SECRET);
        expect(() => verifyUploadToken(token, SECRET)).toThrow("Token has expired.");
    });

    it("should reject a token with no dot separator", () => {
        expect(() => verifyUploadToken("nodothere", SECRET)).toThrow("Invalid token format.");
    });
});
```

- [ ] Create all files listed above
- [ ] Run: `yarn > /dev/null 2>&1`
- [ ] Run: `yarn test packages/api-file-manager-server 2>&1 | tail -30` — expect 11 PASS
- [ ] Commit: `feat(api-file-manager-server): scaffold package with types, utils, and upload token`

---

### Task 2: GraphQL schema + presigned payload + multipart use cases

**Goal:** The public API surface — GraphQL types, resolvers, presigned payload generation, and multipart upload logic.

**Files to create:**

| File | Source |
|------|--------|
| `src/utils/getPresignedPostPayload.ts` | **New.** Replaces S3 presigned post with HMAC token. |
| `src/multiPartUpload/CreateMultiPartUploadUseCase.ts` | **New.** Generates uploadId, creates multipart dir, signs part tokens. |
| `src/multiPartUpload/CompleteMultiPartUploadUseCase.ts` | **New.** Reads parts from disk, sorts numerically, concatenates, cleans up. |
| `src/graphql/schema.ts` | Adapt from S3. Identical `typeDefs`. Resolvers use local presigned payload + multipart use cases instead of S3 SDK. |

**Key differences in `getPresignedPostPayload.ts`** vs S3:

- Takes `serverUrl: string` as 4th parameter (S3 version doesn't need it — AWS generates the URL)
- Returns `LocalPresignedPostData` instead of `PresignedPost` — `{ url: "${serverUrl}/webiny-file-upload", fields: { key: storageKey, token: hmacToken } }`
- Token payload includes `{ key, tenantId, expiresAt: now + 60s, uploadMinFileSize, uploadMaxFileSize }`
- Secret from `process.env.WEBINY_UPLOAD_SECRET`

**Key differences in schema.ts resolvers:**

- `getPreSignedPostPayload`: calls `resolveServerUrl(context.request)`, passes result to `getPresignedPostPayload()`
- `createMultiPartUpload`: uses `new CreateMultiPartUploadUseCase(storagePath)` instead of S3 client. Passes `tenantId` and `serverUrl`. Upload ID is `mdbid()`. Part tokens have 24h expiry.
- `completeMultiPartUpload`: uses `new CompleteMultiPartUploadUseCase(storagePath)`. Constructs full key as `tenants/${tenantId}/files/${args.fileKey}`.

**`CompleteMultiPartUploadUseCase` sort logic** (critical — S3 doesn't need this):

```typescript
const sorted = entries
    .filter(name => name.startsWith("part-"))
    .sort((a, b) => {
        const numA = parseInt(a.replace("part-", ""), 10);
        const numB = parseInt(b.replace("part-", ""), 10);
        return numA - numB;
    });
```

- [ ] Create all files, adapting schema.ts from S3
- [ ] Run: `yarn build -p @webiny/api-file-manager-server 2>&1 | tail -30` — expect success
- [ ] Commit: `feat(api-file-manager-server): add GraphQL schema, presigned payload, and multipart use cases`

---

### Task 3: HTTP upload endpoints

**Goal:** Fastify routes for receiving file uploads with HMAC token verification.

**Files to create:**

| File | Source |
|------|--------|
| `src/routes/uploadRoutes.ts` | **New.** No S3 equivalent — S3 uses presigned URLs directly. |

**Exports:**
- `modifyFastifyPlugin` — `ModifyFastifyPlugin` registering `@fastify/multipart` and `application/octet-stream` content type parser
- `uploadRoutesPlugin` — `RoutePlugin` with POST + PUT handlers

**POST `/webiny-file-upload`** (simple upload via `multipart/form-data`):
1. Parse with `request.file()` from `@fastify/multipart`
2. Extract `key` and `token` from form fields
3. `verifyUploadToken(token, secret)` — reject 400 on failure
4. Validate `payload.key === key`
5. Enforce `uploadMinFileSize` / `uploadMaxFileSize` from token payload
6. Write file to `${WEBINY_LOCAL_STORAGE_PATH}/${key}` (key is already tenant-scoped)
7. Return `204 No Content`

**PUT `/webiny-file-upload/parts`** (multipart part via raw binary):
1. Read query params: `uploadId`, `partNumber`, `token`
2. `verifyUploadToken(token, secret)`
3. Validate `payload.key === expectedKey` where `expectedKey = tenants/${tenantId}/multipart/${uploadId}/part-${partNumber}`
4. Write `request.body` (Buffer) to disk
5. Return `200 OK` with `ETag` header (MD5 hash of chunk)

- [ ] Create `src/routes/uploadRoutes.ts`
- [ ] Run: `yarn build -p @webiny/api-file-manager-server 2>&1 | tail -30` — expect success
- [ ] Commit: `feat(api-file-manager-server): add HTTP upload endpoints with token verification`

---

### Task 4: DI features

**Goal:** All 7 DI features that handle file lifecycle events.

**Files to create — all adapt from S3 equivalents:**

| Feature | S3 source dir | Key change |
|---------|---------------|------------|
| `WriteFileMetadata/` | Same dir in S3 | Copy verbatim. Feature name → `FileManagerServer/WriteFileMetadata`. |
| `GetFileContentsById/` | Same dir in S3 | Replace `S3.getObject()` with `fs.readFile(join(storagePath, metadata.bucketKey))`. Read `storagePath` from `process.env.WEBINY_LOCAL_STORAGE_PATH`. |
| `GetFileContentsByKey/` | Same dir in S3 | Replace `S3.getObject()` with `fs.readFile()`. Resolve content type from file extension (no S3 ContentType header). |
| `DeleteFileFromDisk/` | `DeleteFileFromBucket/` in S3 | Replace S3 folder delete task with inline `fs.rm(path, { recursive: true, force: true })`. No task definition needed — just the event handler + KV store delete. |
| `ExtractMetadata/` | Same dir in S3 | Replace `S3.getObject()` with `fs.readFile()`. Otherwise identical. |
| `FlushCache/` | Same dir in S3 | Two noop handlers (empty `handle()` method). No task definition. Wire `FileAfterDeleteEvent` + `FileBeforeUpdateEvent`. |
| `CleanupStaleMultipartUploads/` | **New** — no S3 equivalent | Task definition that scans `tenants/*/multipart/*/` dirs, removes any older than 24h. |

**`CleanupStaleMultipartUploadsTask` logic:**
- Task ID: `"fileManagerCleanupStaleMultipartUploads"`
- Iterate tenant dirs → multipart dirs → check `stat().mtimeMs`
- Remove dirs where `now - mtimeMs > 24h`
- Use `readdirSafe()` that returns `[]` on ENOENT

- [ ] Create all feature directories and files
- [ ] Run: `yarn build -p @webiny/api-file-manager-server 2>&1 | tail -30` — expect success
- [ ] Commit: `feat(api-file-manager-server): add DI features for file lifecycle, metadata, and cleanup`

---

### Task 5: Asset delivery pipeline

**Goal:** Local implementations of the 4 asset delivery abstractions.

**Files to create — all adapt from S3's `assetDelivery/` dir:**

| File | S3 source | Key change |
|------|-----------|------------|
| `types.ts` | Same | Copy. `presignedUrlTtl` accepted but ignored. |
| `abstractions.ts` | S3 has `S3AssetDeliveryConfig`, `S3Client`, `S3Bucket` | Replace with `LocalAssetDeliveryConfig` (no `presignedUrlTtl`) and `LocalStoragePath` (string, no S3 client). |
| `ObjectKey.ts` | `threatDetection/ObjectKey.ts` | Copy verbatim. |
| `transformation/*` | Same 4 files in S3 | Copy verbatim: `AssetKeyGenerator`, `CallableContentsReader`, `WidthCollection`, `utils`. |
| `LocalContentsReader.ts` | `S3ContentsReader` | Replace `S3.getObject()` with `fs.readFile(join(storagePath, asset.getKey()))`. |
| `LocalAssetResolver.ts` | `S3AssetResolver` | Replace S3ContentsReader with LocalContentsReader. Inject `LocalStoragePath` instead of `S3Client` + `S3Bucket`. |
| `LocalStreamAssetReply.ts` | `S3StreamAssetReply` | Copy verbatim (same 200 + cache-control + body). |
| `LocalOutputStrategy.ts` | `S3OutputStrategy` | Always stream from disk (no presigned URL redirect). Inject `LocalAssetDeliveryConfig` only. |
| `LocalSharpTransform.ts` | `SharpTransform` | Replace all S3 `getObject`/`putObject` with `fs.readFile`/`fs.writeFile` + `mkdir`. Inject `LocalStoragePath` + `LocalAssetDeliveryConfig`. |
| `feature.ts` | Same | Register local abstractions + implementations. |
| `assetDeliveryConfig.ts` | Same | Use `createLocalAssetDeliveryFeature` instead of S3 feature. |
| `createAssetDelivery.ts` | Same | Remove threat detection plugin loader. Keep `createAssetDeliveryPluginLoader` with lazy import. |

- [ ] Create all asset delivery files
- [ ] Run: `yarn build -p @webiny/api-file-manager-server 2>&1 | tail -30` — expect success
- [ ] Commit: `feat(api-file-manager-server): add local asset delivery pipeline`

---

### Task 6: Entry point + build verification

**Goal:** Wire everything together and verify the complete package builds.

**Files to create:**

| File | Source |
|------|--------|
| `src/index.ts` | Adapt from S3. See changes below. |

**Changes from S3's `index.ts`:**

1. ContextPlugin validates `WEBINY_LOCAL_STORAGE_PATH` and `WEBINY_UPLOAD_SECRET` exist; creates storage dir if needed (`mkdirSync(storagePath, { recursive: true })`)
2. Register all 7 features (no `ApplyThreatScanningFeature` — skip the WCP enterprise check)
3. Add `CleanupStaleMultipartUploadsFeature.register(container)`
4. `createFileManagerServer()` returns `[contextPlugin, createServerGraphQLSchema(), uploadRoutesPlugin, modifyFastifyPlugin]`
5. Re-export `createFileUploadModifier` from `./utils/FileUploadModifier.js`
6. Re-export `createAssetDelivery` from `./assetDelivery/createAssetDelivery.js`
7. Name: `"fileManagerServer.context"` (not `"fileManagerS3.context"`)

- [ ] Create `src/index.ts`
- [ ] Run pre-commit checklist: `yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies`
- [ ] Run: `yarn build -p @webiny/api-file-manager-server 2>&1 | tail -30` — expect success
- [ ] Run: `yarn test packages/api-file-manager-server 2>&1 | tail -30` — expect 11 PASS
- [ ] Commit: `feat(api-file-manager-server): add entry point and complete package`
