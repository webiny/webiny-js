# File Manager — Extract Common Code to Base Package

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all duplicated code from `api-file-manager-s3` and `api-file-manager-server` into the base `api-file-manager` package, using DI abstractions for the storage-specific parts.

**Architecture:** The upload GraphQL schema (typeDefs + resolvers) is 100% identical between both provider packages. The resolvers differ only in how they generate upload payloads and handle multipart uploads. We define three DI abstractions in the base package — `GetUploadPayload`, `CreateMultiPartUpload`, `CompleteMultiPartUpload` — and move the shared GraphQL schema to a new `FmUploadGraphQLSchema` (a `GraphQLSchemaFactory` implementation). Each provider package then only implements the three abstractions. Shared utilities (`checkPermissions`, `FileKey`, `FileNormalizer`, `FileUploadModifier`, etc.) and the `WriteFileMetadata` feature — identical in both packages — also move to the base package.

**Tech Stack:** TypeScript, `@webiny/feature/api` DI (`createAbstraction`, `createFeature`), `@webiny/handler-graphql` (`GraphQLSchemaFactory`, `GraphQLSchemaPlugin`), `@webiny/plugins` (`Plugin`).

## Global Constraints

- ES modules only — no CommonJS/`require`.
- One named import per line (one identifier per `import` statement).
- Named exports only — no `export default`.
- Comments: `/* */` style, ending with period. No JSDoc `/** */`.
- Class properties: always `public`/`protected`/`private` + `readonly` where applicable.
- `Impl` suffix for implementation classes; `export const` matches the abstraction name.
- Commit after each task passes. Run the before-commit checklist every time.

---

### Task 1: Move shared upload types to base package

**Files:**
- Create: `packages/api-file-manager/src/features/upload/types.ts`
- Create: `packages/api-file-manager/src/features/upload/index.ts`
- Modify: `packages/api-file-manager-s3/src/types.ts`
- Modify: `packages/api-file-manager-server/src/types.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `FileData`, `PresignedPostPayloadData`, `UploadPayloadResponse` — imported by all later tasks

Both provider packages define identical `FileData` and `PresignedPostPayloadData` interfaces. The `PresignedPostPayloadDataResponse` type differs: S3 uses `PresignedPost` (from AWS SDK) and server uses `LocalPresignedPostData`. In GraphQL, the `data` field is typed as `JSON!`, so we use `Record<string, unknown>` in the shared type.

- [ ] **Step 1: Create the shared types file**

```typescript
/* packages/api-file-manager/src/features/upload/types.ts */

export interface PresignedPostPayloadData {
    name: string;
    type: string;
    size: number;
    id?: string;
    key?: string;
    keyPrefix?: string;
}

export interface FileData {
    id: string;
    key: string;
    name: string;
    size: number;
    type: string;
}

export interface UploadPayloadResponse {
    data: Record<string, unknown>;
    file: FileData;
}

export interface MultiPartUploadFilePart {
    partNumber: number;
    url: string;
}

export interface CreateMultiPartUploadResult {
    file: FileData;
    uploadId: string;
    parts: MultiPartUploadFilePart[];
}
```

- [ ] **Step 2: Create the barrel export**

```typescript
/* packages/api-file-manager/src/features/upload/index.ts */

export type {
    PresignedPostPayloadData,
    FileData,
    UploadPayloadResponse,
    MultiPartUploadFilePart,
    CreateMultiPartUploadResult
} from "./types.js";
```

- [ ] **Step 3: Update `api-file-manager-s3/src/types.ts`**

Replace the duplicated interfaces with re-exports from base, keeping only the S3-specific type:

```typescript
/* packages/api-file-manager-s3/src/types.ts */

import type { PresignedPost } from "@webiny/aws-sdk/client-s3/index.js";
import "@webiny/background-tasks/api/features/TaskController/augmentation.js";

export type {
    PresignedPostPayloadData,
    FileData
} from "@webiny/api-file-manager/features/upload/index.js";

export interface PresignedPostPayloadDataResponse {
    data: PresignedPost;
    file: import("@webiny/api-file-manager/features/upload/index.js").FileData;
}
```

- [ ] **Step 4: Update `api-file-manager-server/src/types.ts`**

Replace the duplicated interfaces with re-exports from base, keeping only the server-specific types:

```typescript
/* packages/api-file-manager-server/src/types.ts */

import "@webiny/background-tasks/api/features/TaskController/augmentation.js";

export type {
    PresignedPostPayloadData,
    FileData
} from "@webiny/api-file-manager/features/upload/index.js";

export interface LocalPresignedPostData {
    url: string;
    fields: {
        key: string;
        token: string;
    };
}

export interface PresignedPostPayloadDataResponse {
    data: LocalPresignedPostData;
    file: import("@webiny/api-file-manager/features/upload/index.js").FileData;
}

export interface UploadTokenPayload {
    key: string;
    tenantId: string;
    expiresAt: number;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
}
```

- [ ] **Step 5: Build and verify**

```bash
yarn build -p @webiny/api-file-manager 2>&1 | tail -10
yarn build -p @webiny/api-file-manager-s3 2>&1 | tail -10
yarn build -p @webiny/api-file-manager-server 2>&1 | tail -10
```

Expected: all three build successfully.

- [ ] **Step 6: Commit**

```bash
git add packages/api-file-manager/src/features/upload/ packages/api-file-manager-s3/src/types.ts packages/api-file-manager-server/src/types.ts
git commit -m "refactor(api-file-manager): extract shared upload types to base package"
```

---

### Task 2: Move shared upload utilities to base package

**Files:**
- Create: `packages/api-file-manager/src/features/upload/utils/checkPermissions.ts`
- Create: `packages/api-file-manager/src/features/upload/utils/FileKey.ts`
- Create: `packages/api-file-manager/src/features/upload/utils/FileExtension.ts`
- Create: `packages/api-file-manager/src/features/upload/utils/mimeTypes.ts`
- Create: `packages/api-file-manager/src/features/upload/utils/FileNormalizer.ts`
- Create: `packages/api-file-manager/src/features/upload/utils/FileUploadModifier.ts`
- Create: `packages/api-file-manager/src/features/upload/utils/createFileNormalizerFromContext.ts`
- Modify: `packages/api-file-manager-s3/src/graphql/schema.ts` (update imports)
- Modify: `packages/api-file-manager-server/src/graphql/schema.ts` (update imports)
- Modify: `packages/api-file-manager-s3/src/index.ts` (update re-export)
- Modify: `packages/api-file-manager-server/src/index.ts` (update re-export)
- Delete: `packages/api-file-manager-s3/src/graphql/checkPermissions.ts`
- Delete: `packages/api-file-manager-s3/src/utils/checkPermissions.ts` (if it exists separately)
- Delete: `packages/api-file-manager-s3/src/utils/FileKey.ts`
- Delete: `packages/api-file-manager-s3/src/utils/FileExtension.ts`
- Delete: `packages/api-file-manager-s3/src/utils/mimeTypes.ts`
- Delete: `packages/api-file-manager-s3/src/utils/FileNormalizer.ts`
- Delete: `packages/api-file-manager-s3/src/utils/FileUploadModifier.ts`
- Delete: `packages/api-file-manager-s3/src/utils/createFileNormalizerFromContext.ts`
- Delete: same files from `packages/api-file-manager-server/src/utils/`
- Move: `packages/api-file-manager-s3/src/utils/FileKey.test.ts` → `packages/api-file-manager/__tests__/FileKey.test.ts`
- Delete: `packages/api-file-manager-server/src/utils/FileKey.test.ts`

**Interfaces:**
- Consumes: `FileData`, `PresignedPostPayloadData` from Task 1
- Produces: `checkPermissions`, `FileNormalizer`, `createFileNormalizerFromContext`, `createFileUploadModifier`, `FileKey`, `FileExtension`, `mimeTypes` — used by Task 4 (upload schema) and by provider packages

These files are byte-for-byte identical between both packages (only comment style and `readonly` diffs). The single code-level difference is the `FileUploadModifierPlugin.type` string — `"fm.s3.uploadModifier"` vs `"fm.server.uploadModifier"`. Use a unified type `"fm.uploadModifier"` in the base package.

- [ ] **Step 1: Copy `checkPermissions.ts` to base package**

Take the implementation from `api-file-manager-s3/src/graphql/checkPermissions.ts`, normalize comment style:

```typescript
/* packages/api-file-manager/src/features/upload/utils/checkPermissions.ts */

import type { FilePermission } from "~/types.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

export const checkPermissions = async (
    identityContext: IdentityContext.Interface,
    check: { rwd?: string } = {}
) => {
    const filePermissions = await identityContext.getPermissions<FilePermission>("fm.file");

    const relevantFilePermissions = filePermissions.filter(current => {
        if (check.rwd && !hasRwd(current, check.rwd)) {
            return false;
        }

        return true;
    });

    if (relevantFilePermissions.length === 0) {
        throw new NotAuthorizedError();
    }

    return relevantFilePermissions;
};

const hasRwd = (filesFilePermissions: FilePermission | FilePermission[], rwd: string): boolean => {
    if (!Array.isArray(filesFilePermissions)) {
        filesFilePermissions = [filesFilePermissions];
    }

    if (!rwd) {
        return true;
    }

    /* Is there a permission that doesn't restrict RWD, all RWD permissions are allowed. */
    const permissionWithoutRwdRestrictions = filesFilePermissions.some(permission => {
        return typeof permission.rwd !== "string";
    });

    if (permissionWithoutRwdRestrictions) {
        return true;
    }

    return filesFilePermissions.some(permission => {
        return permission.rwd && permission.rwd.includes(rwd);
    });
};
```

- [ ] **Step 2: Copy remaining utils to base package**

Copy these files verbatim from `api-file-manager-s3/src/utils/`:
- `FileKey.ts` — update import path for `PresignedPostPayloadData` to `~/features/upload/types.js`
- `FileExtension.ts` — no import changes needed
- `mimeTypes.ts` — no changes
- `FileNormalizer.ts` — update imports for `FileData`, `PresignedPostPayloadData` to `~/features/upload/types.js`, update `FileModifier` import to relative
- `FileUploadModifier.ts` — change `type` to `"fm.uploadModifier"`, update `FileToSign` import to relative
- `createFileNormalizerFromContext.ts` — update imports to relative paths

All files go under `packages/api-file-manager/src/features/upload/utils/`.

- [ ] **Step 3: Move the test**

Move `packages/api-file-manager-s3/src/utils/FileKey.test.ts` to `packages/api-file-manager/__tests__/features/upload/utils/FileKey.test.ts`. Update its imports to point at the new location:

```typescript
import { FileKey } from "~/features/upload/utils/FileKey.js";
```

- [ ] **Step 4: Update barrel export**

Add utils to `packages/api-file-manager/src/features/upload/index.ts`:

```typescript
export type {
    PresignedPostPayloadData,
    FileData,
    UploadPayloadResponse,
    MultiPartUploadFilePart,
    CreateMultiPartUploadResult
} from "./types.js";

export { checkPermissions } from "./utils/checkPermissions.js";
export { FileKey } from "./utils/FileKey.js";
export { FileExtension } from "./utils/FileExtension.js";
export { mimeTypes } from "./utils/mimeTypes.js";
export { FileNormalizer } from "./utils/FileNormalizer.js";
export {
    createFileUploadModifier,
    FileUploadModifierPlugin,
    createModifierFromPlugins
} from "./utils/FileUploadModifier.js";
export { createFileNormalizerFromContext } from "./utils/createFileNormalizerFromContext.js";
```

- [ ] **Step 5: Delete old files from both provider packages**

Remove all the files listed above from `api-file-manager-s3/src/utils/` and `api-file-manager-s3/src/graphql/checkPermissions.ts`, and from `api-file-manager-server/src/utils/` (except `uploadToken.ts` and `resolveServerUrl.ts` which are server-specific).

- [ ] **Step 6: Update imports in provider packages**

In `api-file-manager-s3/src/graphql/schema.ts`, update:
```typescript
import { checkPermissions } from "@webiny/api-file-manager/features/upload/index.js";
import { createFileNormalizerFromContext } from "@webiny/api-file-manager/features/upload/index.js";
```

In `api-file-manager-server/src/graphql/schema.ts`, update the same.

In both `index.ts` files, update `createFileUploadModifier` re-export:
```typescript
export { createFileUploadModifier } from "@webiny/api-file-manager/features/upload/index.js";
```

Update all internal references in provider packages (e.g. `FileNormalizer` used by `getPresignedPostPayload.ts`).

- [ ] **Step 7: Run test**

```bash
yarn test packages/api-file-manager 2>&1 | tail -30
```

Expected: FileKey test passes.

- [ ] **Step 8: Build all three packages**

```bash
yarn build -p @webiny/api-file-manager 2>&1 | tail -10
yarn build -p @webiny/api-file-manager-s3 2>&1 | tail -10
yarn build -p @webiny/api-file-manager-server 2>&1 | tail -10
```

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "refactor(api-file-manager): move shared upload utils to base package"
```

---

### Task 3: Move WriteFileMetadata feature to base package

**Files:**
- Create: `packages/api-file-manager/src/features/upload/WriteFileMetadata/MetadataReader.ts`
- Create: `packages/api-file-manager/src/features/upload/WriteFileMetadata/MetadataWriter.ts`
- Create: `packages/api-file-manager/src/features/upload/WriteFileMetadata/WriteMetadataAfterCreateHandler.ts`
- Create: `packages/api-file-manager/src/features/upload/WriteFileMetadata/WriteMetadataAfterBatchCreateHandler.ts`
- Create: `packages/api-file-manager/src/features/upload/WriteFileMetadata/feature.ts`
- Modify: `packages/api-file-manager/src/features/FileManagerFeature.ts` (register the feature)
- Delete: `packages/api-file-manager-s3/src/features/WriteFileMetadata/` (entire directory)
- Delete: `packages/api-file-manager-server/src/features/WriteFileMetadata/` (entire directory)
- Modify: `packages/api-file-manager-s3/src/index.ts` (remove WriteFileMetadataFeature registration)
- Modify: `packages/api-file-manager-server/src/index.ts` (remove WriteFileMetadataFeature registration)

**Interfaces:**
- Consumes: nothing new
- Produces: `MetadataReader` class — used by `ExtractMetadataTask` in both provider packages (they will import from base)

This feature is identical in both provider packages — `MetadataReader`, `MetadataWriter`, both event handlers, and the feature wiring. The only differences were `readonly` modifiers and comment style.

- [ ] **Step 1: Copy files to base package**

Copy all five files from `api-file-manager-s3/src/features/WriteFileMetadata/` to `packages/api-file-manager/src/features/upload/WriteFileMetadata/`, normalizing to project conventions:
- Add `readonly` to constructor params.
- Use `/* */` comment style.
- Set feature name to `"FileManager/WriteFileMetadata"`.

The code is identical to what's in the S3 package (shown in the research above), just with these style fixes applied.

- [ ] **Step 2: Register in FileManagerFeature**

In `packages/api-file-manager/src/features/FileManagerFeature.ts`, add:

```typescript
import { WriteFileMetadataFeature } from "~/features/upload/WriteFileMetadata/feature.js";
```

And inside the `register` method:

```typescript
WriteFileMetadataFeature.register(container);
```

- [ ] **Step 3: Delete from both provider packages**

Remove `packages/api-file-manager-s3/src/features/WriteFileMetadata/` entirely.
Remove `packages/api-file-manager-server/src/features/WriteFileMetadata/` entirely.

- [ ] **Step 4: Remove registration from provider index files**

In `packages/api-file-manager-s3/src/index.ts`, remove:
```typescript
import { WriteFileMetadataFeature } from "~/features/WriteFileMetadata/feature.js";
```
and `WriteFileMetadataFeature.register(container);`

Same in `packages/api-file-manager-server/src/index.ts`.

- [ ] **Step 5: Update MetadataReader imports in provider packages**

In both provider packages, `ExtractMetadataTask.ts` imports `MetadataReader` from `../WriteFileMetadata/MetadataReader.js`. Update to:

```typescript
import { MetadataReader } from "@webiny/api-file-manager/features/upload/WriteFileMetadata/MetadataReader.js";
```

Same for `GetFileContentsByIdUseCase.ts` in both packages.

- [ ] **Step 6: Build and verify**

```bash
yarn build -p @webiny/api-file-manager 2>&1 | tail -10
yarn build -p @webiny/api-file-manager-s3 2>&1 | tail -10
yarn build -p @webiny/api-file-manager-server 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "refactor(api-file-manager): move WriteFileMetadata feature to base package"
```

---

### Task 4: Define upload abstractions in base package

**Files:**
- Create: `packages/api-file-manager/src/features/upload/GetUploadPayload/abstractions.ts`
- Create: `packages/api-file-manager/src/features/upload/GetUploadPayload/index.ts`
- Create: `packages/api-file-manager/src/features/upload/CreateMultiPartUpload/abstractions.ts`
- Create: `packages/api-file-manager/src/features/upload/CreateMultiPartUpload/index.ts`
- Create: `packages/api-file-manager/src/features/upload/CompleteMultiPartUpload/abstractions.ts`
- Create: `packages/api-file-manager/src/features/upload/CompleteMultiPartUpload/index.ts`

**Interfaces:**
- Consumes: `FileData`, `UploadPayloadResponse`, `CreateMultiPartUploadResult` from Task 1
- Produces: `GetUploadPayloadUseCase`, `CreateMultiPartUploadUseCase`, `CompleteMultiPartUploadUseCase` — used by Task 5 (GraphQL schema) and Tasks 6–7 (provider implementations)

- [ ] **Step 1: Create `GetUploadPayload` abstraction**

```typescript
/* packages/api-file-manager/src/features/upload/GetUploadPayload/abstractions.ts */

import { createAbstraction } from "@webiny/feature/api";
import type { FileData } from "~/features/upload/types.js";
import type { UploadPayloadResponse } from "~/features/upload/types.js";
import type { FileManagerSettings } from "~/domain/settings/types.js";

export interface IGetUploadPayloadUseCase {
    execute(file: FileData, settings: FileManagerSettings): Promise<UploadPayloadResponse>;
}

export const GetUploadPayloadUseCase =
    createAbstraction<IGetUploadPayloadUseCase>("GetUploadPayloadUseCase");

export namespace GetUploadPayloadUseCase {
    export type Interface = IGetUploadPayloadUseCase;
}
```

```typescript
/* packages/api-file-manager/src/features/upload/GetUploadPayload/index.ts */

export { GetUploadPayloadUseCase } from "./abstractions.js";
```

- [ ] **Step 2: Create `CreateMultiPartUpload` abstraction**

```typescript
/* packages/api-file-manager/src/features/upload/CreateMultiPartUpload/abstractions.ts */

import { createAbstraction } from "@webiny/feature/api";
import type { FileData } from "~/features/upload/types.js";
import type { CreateMultiPartUploadResult } from "~/features/upload/types.js";

export interface ICreateMultiPartUploadParams {
    file: FileData;
    numberOfParts: number;
}

export interface ICreateMultiPartUploadUseCase {
    execute(params: ICreateMultiPartUploadParams): Promise<CreateMultiPartUploadResult>;
}

export const CreateMultiPartUploadUseCase =
    createAbstraction<ICreateMultiPartUploadUseCase>("CreateMultiPartUploadUseCase");

export namespace CreateMultiPartUploadUseCase {
    export type Interface = ICreateMultiPartUploadUseCase;
    export type Params = ICreateMultiPartUploadParams;
}
```

```typescript
/* packages/api-file-manager/src/features/upload/CreateMultiPartUpload/index.ts */

export { CreateMultiPartUploadUseCase } from "./abstractions.js";
```

- [ ] **Step 3: Create `CompleteMultiPartUpload` abstraction**

```typescript
/* packages/api-file-manager/src/features/upload/CompleteMultiPartUpload/abstractions.ts */

import { createAbstraction } from "@webiny/feature/api";

export interface ICompleteMultiPartUploadParams {
    fileKey: string;
    uploadId: string;
}

export interface ICompleteMultiPartUploadUseCase {
    execute(params: ICompleteMultiPartUploadParams): Promise<void>;
}

export const CompleteMultiPartUploadUseCase =
    createAbstraction<ICompleteMultiPartUploadUseCase>("CompleteMultiPartUploadUseCase");

export namespace CompleteMultiPartUploadUseCase {
    export type Interface = ICompleteMultiPartUploadUseCase;
    export type Params = ICompleteMultiPartUploadParams;
}
```

```typescript
/* packages/api-file-manager/src/features/upload/CompleteMultiPartUpload/index.ts */

export { CompleteMultiPartUploadUseCase } from "./abstractions.js";
```

- [ ] **Step 4: Add abstractions to barrel export**

Update `packages/api-file-manager/src/features/upload/index.ts` to also export:

```typescript
export { GetUploadPayloadUseCase } from "./GetUploadPayload/index.js";
export { CreateMultiPartUploadUseCase } from "./CreateMultiPartUpload/index.js";
export { CompleteMultiPartUploadUseCase } from "./CompleteMultiPartUpload/index.js";
```

- [ ] **Step 5: Build**

```bash
yarn build -p @webiny/api-file-manager 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add packages/api-file-manager/src/features/upload/
git commit -m "feat(api-file-manager): define upload use case abstractions"
```

---

### Task 5: Create upload GraphQL schema in base package

**Files:**
- Create: `packages/api-file-manager/src/graphql/FmUploadGraphQLSchema.ts`
- Modify: `packages/api-file-manager/src/features/FileManagerFeature.ts` (register the schema)

**Interfaces:**
- Consumes: `GetUploadPayloadUseCase`, `CreateMultiPartUploadUseCase`, `CompleteMultiPartUploadUseCase` from Task 4; `checkPermissions`, `createFileNormalizerFromContext` from Task 2; `GetSettingsUseCase`, `IdentityContext` from existing packages
- Produces: `FmUploadGraphQLSchema` — a `GraphQLSchemaFactory` implementation registered in DI

The typeDefs are byte-for-byte identical between `-s3` and `-server`. The resolvers follow the same structure in both: check permissions → get settings → normalize file → delegate to storage-specific logic. The storage-specific logic is now behind the DI abstractions.

- [ ] **Step 1: Create FmUploadGraphQLSchema**

```typescript
/* packages/api-file-manager/src/graphql/FmUploadGraphQLSchema.ts */

import pMap from "p-map";
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { ErrorResponse } from "@webiny/handler-graphql/responses.js";
import { Response } from "@webiny/handler-graphql/responses.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import { GetUploadPayloadUseCase } from "~/features/upload/GetUploadPayload/index.js";
import { CreateMultiPartUploadUseCase } from "~/features/upload/CreateMultiPartUpload/index.js";
import { CompleteMultiPartUploadUseCase } from "~/features/upload/CompleteMultiPartUpload/index.js";
import { checkPermissions } from "~/features/upload/utils/checkPermissions.js";
import { createFileNormalizerFromContext } from "~/features/upload/utils/createFileNormalizerFromContext.js";
import type { PresignedPostPayloadData } from "~/features/upload/types.js";

class FmUploadGraphQLSchema_ implements GraphQLSchemaFactory.Interface {
    public async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        this.addTypeDefs(builder);
        this.addQueryResolvers(builder);
        this.addMutationResolvers(builder);
        return builder;
    }

    private addTypeDefs(builder: GraphQLSchemaFactory.SchemaBuilder): void {
        builder.addTypeDefs(/* GraphQL */ `
            type UploadFileResponseDataFile {
                id: ID!
                name: String!
                type: String!
                size: Long!
                key: String!
            }

            input PreSignedPostPayloadInput {
                id: ID
                name: String!
                type: String!
                size: Long!
                key: String
                keyPrefix: String
            }

            type GetPreSignedPostPayloadResponseDataFile {
                id: ID!
                name: String!
                type: String!
                size: Long!
                key: String!
            }

            type GetPreSignedPostPayloadResponseData {
                data: JSON!
                file: UploadFileResponseDataFile!
            }

            type GetPreSignedPostPayloadResponse {
                error: FmError
                data: GetPreSignedPostPayloadResponseData
            }

            type MultiPartUploadFilePart {
                partNumber: Int!
                url: String!
            }

            type CreateMultiPartUploadResponseData {
                file: GetPreSignedPostPayloadResponseDataFile!
                uploadId: String!
                parts: [MultiPartUploadFilePart!]!
            }

            type CompleteMultiPartUploadResponse {
                data: Boolean
                error: FmError
            }

            type GetPreSignedPostPayloadsResponse {
                error: FmError
                data: [GetPreSignedPostPayloadResponseData!]!
            }

            extend type FmQuery {
                getPreSignedPostPayload(
                    data: PreSignedPostPayloadInput!
                ): GetPreSignedPostPayloadResponse
                getPreSignedPostPayloads(
                    data: [PreSignedPostPayloadInput]!
                ): GetPreSignedPostPayloadsResponse
            }

            type CreateMultiPartUploadResponse {
                data: CreateMultiPartUploadResponseData
                error: FmError
            }

            input MultiPartUploadFilePartInput {
                partNumber: Int!
                etag: String!
            }

            extend type FmMutation {
                createMultiPartUpload(
                    data: PreSignedPostPayloadInput!
                    numberOfParts: Number!
                ): CreateMultiPartUploadResponse

                completeMultiPartUpload(
                    fileKey: String!
                    uploadId: String!
                ): CompleteMultiPartUploadResponse
            }
        `);
    }

    private addQueryResolvers(builder: GraphQLSchemaFactory.SchemaBuilder): void {
        builder.addResolver({
            path: "FmQuery.getPreSignedPostPayload",
            dependencies: [IdentityContext, GetSettingsUseCase, GetUploadPayloadUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                getSettings: GetSettingsUseCase.Interface,
                getUploadPayload: GetUploadPayloadUseCase.Interface
            ) => {
                return async ({ args, context }: { args: any; context: any }) => {
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const data = args.data as PresignedPostPayloadData;
                        const settingsResult = await getSettings.execute();
                        const settings = settingsResult.value;

                        const normalizer = createFileNormalizerFromContext(context);
                        const file = await normalizer.normalizeFile(data);

                        const result = await getUploadPayload.execute(file, settings);
                        return new Response(result);
                    } catch (e: any) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                };
            }
        });

        builder.addResolver({
            path: "FmQuery.getPreSignedPostPayloads",
            dependencies: [IdentityContext, GetSettingsUseCase, GetUploadPayloadUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                getSettings: GetSettingsUseCase.Interface,
                getUploadPayload: GetUploadPayloadUseCase.Interface
            ) => {
                return async ({ args, context }: { args: any; context: any }) => {
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const files = args.data as PresignedPostPayloadData[];
                        const settingsResult = await getSettings.execute();
                        const settings = settingsResult.value;

                        const normalizer = createFileNormalizerFromContext(context);

                        const results = await pMap(files, async data => {
                            const file = await normalizer.normalizeFile(data);
                            return getUploadPayload.execute(file, settings);
                        });

                        return new Response(results);
                    } catch (e: any) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                };
            }
        });
    }

    private addMutationResolvers(builder: GraphQLSchemaFactory.SchemaBuilder): void {
        builder.addResolver({
            path: "FmMutation.createMultiPartUpload",
            dependencies: [IdentityContext, CreateMultiPartUploadUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                createMultiPartUpload: CreateMultiPartUploadUseCase.Interface
            ) => {
                return async ({ args, context }: { args: any; context: any }) => {
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        const normalizer = createFileNormalizerFromContext(context);
                        const file = await normalizer.normalizeFile(args.data);

                        const result = await createMultiPartUpload.execute({
                            file,
                            numberOfParts: args.numberOfParts
                        });

                        return new Response(result);
                    } catch (e: any) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                };
            }
        });

        builder.addResolver({
            path: "FmMutation.completeMultiPartUpload",
            dependencies: [IdentityContext, CompleteMultiPartUploadUseCase],
            resolver: (
                identityContext: IdentityContext.Interface,
                completeMultiPartUpload: CompleteMultiPartUploadUseCase.Interface
            ) => {
                return async ({ args }: { args: any }) => {
                    try {
                        await checkPermissions(identityContext, { rwd: "w" });

                        await completeMultiPartUpload.execute({
                            fileKey: args.fileKey,
                            uploadId: args.uploadId
                        });

                        return new Response(true);
                    } catch (e: any) {
                        return new ErrorResponse({
                            message: e.message,
                            code: e.code,
                            data: e.data
                        });
                    }
                };
            }
        });
    }
}

export const FmUploadGraphQLSchema = GraphQLSchemaFactory.createImplementation({
    implementation: FmUploadGraphQLSchema_,
    dependencies: []
});
```

- [ ] **Step 2: Register in FileManagerFeature**

In `packages/api-file-manager/src/features/FileManagerFeature.ts`, add:

```typescript
import { FmUploadGraphQLSchema } from "~/graphql/FmUploadGraphQLSchema.js";
```

And inside the `register` method:

```typescript
container.register(FmUploadGraphQLSchema);
```

- [ ] **Step 3: Build**

```bash
yarn build -p @webiny/api-file-manager 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-file-manager/src/graphql/FmUploadGraphQLSchema.ts packages/api-file-manager/src/features/FileManagerFeature.ts
git commit -m "feat(api-file-manager): add upload GraphQL schema with DI abstractions"
```

---

### Task 6: Implement S3 upload abstractions and remove old schema

**Files:**
- Create: `packages/api-file-manager-s3/src/features/GetUploadPayload/GetUploadPayloadUseCase.ts`
- Create: `packages/api-file-manager-s3/src/features/GetUploadPayload/feature.ts`
- Create: `packages/api-file-manager-s3/src/features/CreateMultiPartUpload/CreateMultiPartUploadUseCase.ts`
- Create: `packages/api-file-manager-s3/src/features/CreateMultiPartUpload/feature.ts`
- Create: `packages/api-file-manager-s3/src/features/CompleteMultiPartUpload/CompleteMultiPartUploadUseCase.ts`
- Create: `packages/api-file-manager-s3/src/features/CompleteMultiPartUpload/feature.ts`
- Delete: `packages/api-file-manager-s3/src/graphql/schema.ts`
- Delete: `packages/api-file-manager-s3/src/graphql/` (directory, if empty after removing checkPermissions in Task 2)
- Delete: `packages/api-file-manager-s3/src/multiPartUpload/` (logic inlined into features)
- Modify: `packages/api-file-manager-s3/src/index.ts` (remove `createS3GraphQLSchema`, register new features)

**Interfaces:**
- Consumes: `GetUploadPayloadUseCase`, `CreateMultiPartUploadUseCase`, `CompleteMultiPartUploadUseCase` abstractions from Task 4; `FileData`, `UploadPayloadResponse` from Task 1
- Produces: S3-specific implementations of the three abstractions

- [ ] **Step 1: Create `GetUploadPayload` implementation**

```typescript
/* packages/api-file-manager-s3/src/features/GetUploadPayload/GetUploadPayloadUseCase.ts */

import type { PresignedPostOptions } from "@webiny/aws-sdk/client-s3/index.js";
import { S3Client } from "@webiny/aws-sdk/client-s3/index.js";
import { createPresignedPost } from "@webiny/aws-sdk/client-s3/index.js";
import { validation } from "@webiny/validation";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetUploadPayloadUseCase } from "@webiny/api-file-manager/features/upload/GetUploadPayload/index.js";
import type { FileData } from "@webiny/api-file-manager/features/upload/types.js";
import type { UploadPayloadResponse } from "@webiny/api-file-manager/features/upload/types.js";
import type { FileManagerSettings } from "@webiny/api-file-manager/domain/settings/types.js";

const UPLOAD_MAX_FILE_SIZE_DEFAULT = 1099511627776; /* 1TB */

const sanitizeFileSizeValue = (value: number, defaultValue: number): number => {
    try {
        validation.validateSync(value, "required,numeric,gte:0");
        return value;
    } catch {
        return defaultValue;
    }
};

class GetUploadPayloadUseCaseImpl implements GetUploadPayloadUseCase.Interface {
    public constructor(private readonly tenantContext: TenantContext.Interface) {}

    public async execute(
        file: FileData,
        settings: FileManagerSettings
    ): Promise<UploadPayloadResponse> {
        const uploadMinFileSize = sanitizeFileSizeValue(settings.uploadMinFileSize, 0);
        const uploadMaxFileSize = sanitizeFileSizeValue(
            settings.uploadMaxFileSize,
            UPLOAD_MAX_FILE_SIZE_DEFAULT
        );

        const tenant = this.tenantContext.getTenant();
        const storageKey = `tenants/${tenant.id}/files/${file.key}`;

        const params = {
            Key: storageKey.startsWith("/") ? storageKey.slice(1) : storageKey,
            Expires: 60,
            Bucket: String(process.env.S3_BUCKET),
            Conditions: [
                ["content-length-range", uploadMinFileSize, uploadMaxFileSize]
            ] as PresignedPostOptions["Conditions"],
            Fields: {
                "Content-Type": file.type
            }
        };

        const s3 = new S3Client();
        const payload = await createPresignedPost(s3, params);

        return {
            data: payload as unknown as Record<string, unknown>,
            file
        };
    }
}

export const GetUploadPayloadUseCaseImplementation =
    GetUploadPayloadUseCase.createImplementation({
        implementation: GetUploadPayloadUseCaseImpl,
        dependencies: [TenantContext]
    });
```

```typescript
/* packages/api-file-manager-s3/src/features/GetUploadPayload/feature.ts */

import { createFeature } from "@webiny/feature/api";
import { GetUploadPayloadUseCaseImplementation } from "./GetUploadPayloadUseCase.js";

export const GetUploadPayloadFeature = createFeature({
    name: "FileManagerS3/GetUploadPayload",
    register(container) {
        container.register(GetUploadPayloadUseCaseImplementation);
    }
});
```

- [ ] **Step 2: Create `CreateMultiPartUpload` implementation**

```typescript
/* packages/api-file-manager-s3/src/features/CreateMultiPartUpload/CreateMultiPartUploadUseCase.ts */

import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { getSignedUrl } from "@webiny/aws-sdk/client-s3/index.js";
import { UploadPartCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { CreateMultiPartUploadUseCase } from "@webiny/api-file-manager/features/upload/CreateMultiPartUpload/index.js";
import type { CreateMultiPartUploadResult } from "@webiny/api-file-manager/features/upload/types.js";

class CreateMultiPartUploadUseCaseImpl implements CreateMultiPartUploadUseCase.Interface {
    public async execute(
        params: CreateMultiPartUploadUseCase.Params
    ): Promise<CreateMultiPartUploadResult> {
        const { file, numberOfParts } = params;

        const bucket = String(process.env.S3_BUCKET);
        const s3Client = new S3({ region: process.env.AWS_REGION });
        const s3Params = { Bucket: bucket, Key: file.key };

        const { UploadId } = await s3Client.createMultipartUpload(s3Params);

        const parts = await Promise.all(
            Array.from({ length: numberOfParts }).map((_, index) => {
                return getSignedUrl(
                    s3Client,
                    new UploadPartCommand({ ...s3Params, UploadId, PartNumber: index + 1 }),
                    { expiresIn: 86400 }
                ).then(url => ({
                    url,
                    partNumber: index + 1
                }));
            })
        );

        return {
            file,
            uploadId: UploadId as string,
            parts
        };
    }
}

export const CreateMultiPartUploadUseCaseImplementation =
    CreateMultiPartUploadUseCase.createImplementation({
        implementation: CreateMultiPartUploadUseCaseImpl,
        dependencies: []
    });
```

```typescript
/* packages/api-file-manager-s3/src/features/CreateMultiPartUpload/feature.ts */

import { createFeature } from "@webiny/feature/api";
import { CreateMultiPartUploadUseCaseImplementation } from "./CreateMultiPartUploadUseCase.js";

export const CreateMultiPartUploadFeature = createFeature({
    name: "FileManagerS3/CreateMultiPartUpload",
    register(container) {
        container.register(CreateMultiPartUploadUseCaseImplementation);
    }
});
```

- [ ] **Step 3: Create `CompleteMultiPartUpload` implementation**

```typescript
/* packages/api-file-manager-s3/src/features/CompleteMultiPartUpload/CompleteMultiPartUploadUseCase.ts */

import type { Part } from "@webiny/aws-sdk/client-s3/index.js";
import type { ListPartsOutput } from "@webiny/aws-sdk/client-s3/index.js";
import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import { ListPartsCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { CompleteMultipartUploadCommand } from "@webiny/aws-sdk/client-s3/index.js";
import { CompleteMultiPartUploadUseCase } from "@webiny/api-file-manager/features/upload/CompleteMultiPartUpload/index.js";

const EMPTY_MARKER_VALUES = [undefined, "0"];

class CompleteMultiPartUploadUseCaseImpl implements CompleteMultiPartUploadUseCase.Interface {
    public async execute(params: CompleteMultiPartUploadUseCase.Params): Promise<void> {
        const bucket = String(process.env.S3_BUCKET);
        const s3Client = new S3({ region: process.env.AWS_REGION });

        const uploadParams = {
            Bucket: bucket,
            Key: params.fileKey,
            UploadId: params.uploadId
        };

        const allParts = await getAllUploadParts(s3Client, uploadParams);

        const command = new CompleteMultipartUploadCommand({
            ...uploadParams,
            MultipartUpload: { Parts: allParts }
        });

        await s3Client.send(command);
    }
}

interface GetAllUploadPartsParams {
    Bucket: string;
    Key: string;
    UploadId: string;
}

async function getAllUploadParts(s3Client: S3, params: GetAllUploadPartsParams) {
    const parts: Part[] = [];

    let marker: string | undefined = undefined;
    while (true) {
        const { Parts, PartNumberMarker }: ListPartsOutput = await s3Client.send(
            new ListPartsCommand({
                ...params,
                PartNumberMarker: marker
            })
        );

        if (Parts) {
            Parts.forEach(part => parts.push(part));
        }

        marker = PartNumberMarker || undefined;
        if (EMPTY_MARKER_VALUES.includes(marker)) {
            break;
        }
    }

    return parts.map(part => ({
        ETag: part.ETag as string,
        PartNumber: part.PartNumber as number
    }));
}

export const CompleteMultiPartUploadUseCaseImplementation =
    CompleteMultiPartUploadUseCase.createImplementation({
        implementation: CompleteMultiPartUploadUseCaseImpl,
        dependencies: []
    });
```

```typescript
/* packages/api-file-manager-s3/src/features/CompleteMultiPartUpload/feature.ts */

import { createFeature } from "@webiny/feature/api";
import { CompleteMultiPartUploadUseCaseImplementation } from "./CompleteMultiPartUploadUseCase.js";

export const CompleteMultiPartUploadFeature = createFeature({
    name: "FileManagerS3/CompleteMultiPartUpload",
    register(container) {
        container.register(CompleteMultiPartUploadUseCaseImplementation);
    }
});
```

- [ ] **Step 4: Delete old graphql and multiPartUpload directories**

```bash
rm -rf packages/api-file-manager-s3/src/graphql/
rm -rf packages/api-file-manager-s3/src/multiPartUpload/
```

- [ ] **Step 5: Update `api-file-manager-s3/src/index.ts`**

Remove the `createS3GraphQLSchema` import and usage. Register the three new features. The updated file:

```typescript
/* packages/api-file-manager-s3/src/index.ts */

import { ContextPlugin } from "@webiny/api";
import { WcpContext } from "@webiny/api-core/features/wcp/WcpContext/index.js";
import { DeleteFileFromBucketFeature } from "~/features/DeleteFileFromBucket/feature.js";
import { ApplyThreatScanningFeature } from "~/enterprise/ApplyThreatScanning/feature.js";
import { FlushCacheFeature } from "~/features/FlushCache/feature.js";
import { ExtractMetadataFeature } from "~/features/ExtractMetadata/feature.js";
import { GetFileContentsByIdFeature } from "~/features/GetFileContentsById/feature.js";
import { GetFileContentsByKeyFeature } from "~/features/GetFileContentsByKey/feature.js";
import { GetUploadPayloadFeature } from "~/features/GetUploadPayload/feature.js";
import { CreateMultiPartUploadFeature } from "~/features/CreateMultiPartUpload/feature.js";
import { CompleteMultiPartUploadFeature } from "~/features/CompleteMultiPartUpload/feature.js";
export { createFileUploadModifier } from "@webiny/api-file-manager/features/upload/index.js";
export { createAssetDelivery } from "./assetDelivery/createAssetDelivery.js";

const contextPlugin = new ContextPlugin(context => {
    const container = context.container;

    FlushCacheFeature.register(container);
    DeleteFileFromBucketFeature.register(container);
    ExtractMetadataFeature.register(container);
    GetFileContentsByIdFeature.register(container);
    GetFileContentsByKeyFeature.register(container);
    GetUploadPayloadFeature.register(container);
    CreateMultiPartUploadFeature.register(container);
    CompleteMultiPartUploadFeature.register(container);

    const wcp = container.resolve(WcpContext);
    if (wcp.canUseFileManagerThreatDetection()) {
        ApplyThreatScanningFeature.register(container);
    }
});

contextPlugin.name = `fileManagerS3.context`;

export const createFileManagerS3 = () => [contextPlugin];
```

Note: `WriteFileMetadataFeature` was already removed in Task 3. `createS3GraphQLSchema()` is no longer in the returned array — the upload schema is now registered via `FmUploadGraphQLSchema` in the base package.

- [ ] **Step 6: Build and test**

```bash
yarn build -p @webiny/api-file-manager-s3 2>&1 | tail -10
```

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat(api-file-manager-s3): implement upload abstractions, remove old schema"
```

---

### Task 7: Implement server upload abstractions and remove old schema

**Files:**
- Create: `packages/api-file-manager-server/src/features/GetUploadPayload/GetUploadPayloadUseCase.ts`
- Create: `packages/api-file-manager-server/src/features/GetUploadPayload/feature.ts`
- Create: `packages/api-file-manager-server/src/features/CreateMultiPartUpload/CreateMultiPartUploadUseCase.ts`
- Create: `packages/api-file-manager-server/src/features/CreateMultiPartUpload/feature.ts`
- Create: `packages/api-file-manager-server/src/features/CompleteMultiPartUpload/CompleteMultiPartUploadUseCase.ts`
- Create: `packages/api-file-manager-server/src/features/CompleteMultiPartUpload/feature.ts`
- Delete: `packages/api-file-manager-server/src/graphql/schema.ts`
- Delete: `packages/api-file-manager-server/src/graphql/` (directory)
- Delete: `packages/api-file-manager-server/src/multiPartUpload/` (logic inlined into features)
- Modify: `packages/api-file-manager-server/src/index.ts`

**Interfaces:**
- Consumes: same abstractions as Task 6
- Produces: server-specific implementations using HMAC tokens + local disk

- [ ] **Step 1: Create `GetUploadPayload` implementation**

```typescript
/* packages/api-file-manager-server/src/features/GetUploadPayload/GetUploadPayloadUseCase.ts */

import { validation } from "@webiny/validation";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { HandlerContext } from "@webiny/handler/HandlerContext.js";
import { GetUploadPayloadUseCase } from "@webiny/api-file-manager/features/upload/GetUploadPayload/index.js";
import type { FileData } from "@webiny/api-file-manager/features/upload/types.js";
import type { UploadPayloadResponse } from "@webiny/api-file-manager/features/upload/types.js";
import type { FileManagerSettings } from "@webiny/api-file-manager/domain/settings/types.js";
import { createUploadToken } from "~/utils/uploadToken.js";
import { resolveServerUrl } from "~/utils/resolveServerUrl.js";

const UPLOAD_MAX_FILE_SIZE_DEFAULT = 1099511627776; /* 1TB */

const sanitizeFileSizeValue = (value: number, defaultValue: number): number => {
    try {
        validation.validateSync(value, "required,numeric,gte:0");
        return value;
    } catch {
        return defaultValue;
    }
};

class GetUploadPayloadUseCaseImpl implements GetUploadPayloadUseCase.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly handlerContext: HandlerContext.Interface
    ) {}

    public async execute(
        file: FileData,
        settings: FileManagerSettings
    ): Promise<UploadPayloadResponse> {
        const uploadMinFileSize = sanitizeFileSizeValue(settings.uploadMinFileSize, 0);
        const uploadMaxFileSize = sanitizeFileSizeValue(
            settings.uploadMaxFileSize,
            UPLOAD_MAX_FILE_SIZE_DEFAULT
        );

        const tenant = this.tenantContext.getTenant();
        const storageKey = `tenants/${tenant.id}/files/${file.key}`;
        const secret = process.env.WEBINY_UPLOAD_SECRET as string;
        const expiresAt = Date.now() + 60_000;

        const token = createUploadToken(
            {
                key: storageKey,
                tenantId: tenant.id,
                expiresAt,
                uploadMinFileSize,
                uploadMaxFileSize
            },
            secret
        );

        const serverUrl = await resolveServerUrl(this.handlerContext.request);

        const data = {
            url: `${serverUrl}/webiny-file-upload`,
            fields: {
                key: storageKey,
                token
            }
        };

        return {
            data: data as unknown as Record<string, unknown>,
            file
        };
    }
}

export const GetUploadPayloadUseCaseImplementation =
    GetUploadPayloadUseCase.createImplementation({
        implementation: GetUploadPayloadUseCaseImpl,
        dependencies: [TenantContext, HandlerContext]
    });
```

> **Note:** Check whether `HandlerContext` is the correct abstraction for accessing `context.request`. If the request is available through a different DI token, adjust accordingly. The S3 version doesn't need the request at all; the server version needs it to call `resolveServerUrl(context.request)`.

```typescript
/* packages/api-file-manager-server/src/features/GetUploadPayload/feature.ts */

import { createFeature } from "@webiny/feature/api";
import { GetUploadPayloadUseCaseImplementation } from "./GetUploadPayloadUseCase.js";

export const GetUploadPayloadFeature = createFeature({
    name: "FileManagerServer/GetUploadPayload",
    register(container) {
        container.register(GetUploadPayloadUseCaseImplementation);
    }
});
```

- [ ] **Step 2: Create `CreateMultiPartUpload` implementation**

```typescript
/* packages/api-file-manager-server/src/features/CreateMultiPartUpload/CreateMultiPartUploadUseCase.ts */

import path from "node:path";
import { mkdir } from "node:fs/promises";
import { mdbid } from "@webiny/utils";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { HandlerContext } from "@webiny/handler/HandlerContext.js";
import { CreateMultiPartUploadUseCase } from "@webiny/api-file-manager/features/upload/CreateMultiPartUpload/index.js";
import type { CreateMultiPartUploadResult } from "@webiny/api-file-manager/features/upload/types.js";
import { createUploadToken } from "~/utils/uploadToken.js";
import { resolveServerUrl } from "~/utils/resolveServerUrl.js";

class CreateMultiPartUploadUseCaseImpl implements CreateMultiPartUploadUseCase.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly handlerContext: HandlerContext.Interface
    ) {}

    public async execute(
        params: CreateMultiPartUploadUseCase.Params
    ): Promise<CreateMultiPartUploadResult> {
        const { file, numberOfParts } = params;
        const storagePath = String(process.env.WEBINY_LOCAL_STORAGE_PATH);
        const tenant = this.tenantContext.getTenant();
        const serverUrl = await resolveServerUrl(this.handlerContext.request);

        const uploadId = mdbid();

        const multipartDir = path.join(
            storagePath,
            "tenants",
            tenant.id,
            "multipart",
            uploadId
        );
        await mkdir(multipartDir, { recursive: true });

        const secret = process.env.WEBINY_UPLOAD_SECRET as string;
        const expiresAt = Date.now() + 86_400_000; /* 24h */

        const parts = Array.from({ length: numberOfParts }, (_, index) => {
            const partNumber = index + 1;

            const token = createUploadToken(
                {
                    key: `tenants/${tenant.id}/multipart/${uploadId}/part-${partNumber}`,
                    tenantId: tenant.id,
                    expiresAt,
                    uploadMinFileSize: 0,
                    uploadMaxFileSize: 1_099_511_627_776
                },
                secret
            );

            const url = `${serverUrl}/webiny-file-upload/parts?uploadId=${uploadId}&partNumber=${partNumber}&token=${token}`;

            return { partNumber, url };
        });

        return { file, uploadId, parts };
    }
}

export const CreateMultiPartUploadUseCaseImplementation =
    CreateMultiPartUploadUseCase.createImplementation({
        implementation: CreateMultiPartUploadUseCaseImpl,
        dependencies: [TenantContext, HandlerContext]
    });
```

```typescript
/* packages/api-file-manager-server/src/features/CreateMultiPartUpload/feature.ts */

import { createFeature } from "@webiny/feature/api";
import { CreateMultiPartUploadUseCaseImplementation } from "./CreateMultiPartUploadUseCase.js";

export const CreateMultiPartUploadFeature = createFeature({
    name: "FileManagerServer/CreateMultiPartUpload",
    register(container) {
        container.register(CreateMultiPartUploadUseCaseImplementation);
    }
});
```

- [ ] **Step 3: Create `CompleteMultiPartUpload` implementation**

```typescript
/* packages/api-file-manager-server/src/features/CompleteMultiPartUpload/CompleteMultiPartUploadUseCase.ts */

import path from "node:path";
import { mkdir } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { writeFile } from "node:fs/promises";
import { rm } from "node:fs/promises";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CompleteMultiPartUploadUseCase } from "@webiny/api-file-manager/features/upload/CompleteMultiPartUpload/index.js";

class CompleteMultiPartUploadUseCaseImpl implements CompleteMultiPartUploadUseCase.Interface {
    public constructor(private readonly tenantContext: TenantContext.Interface) {}

    public async execute(params: CompleteMultiPartUploadUseCase.Params): Promise<void> {
        const { fileKey, uploadId } = params;
        const storagePath = String(process.env.WEBINY_LOCAL_STORAGE_PATH);
        const tenant = this.tenantContext.getTenant();

        assertNoTraversal(uploadId);

        const fullFileKey = `tenants/${tenant.id}/files/${fileKey}`;
        const destPath = path.join(storagePath, fullFileKey);
        assertPathContained(destPath, storagePath);

        const multipartDir = path.join(
            storagePath,
            "tenants",
            tenant.id,
            "multipart",
            uploadId
        );

        const entries = await readdir(multipartDir);
        const sorted = entries
            .filter(name => name.startsWith("part-"))
            .sort((a, b) => {
                const numA = parseInt(a.replace("part-", ""), 10);
                const numB = parseInt(b.replace("part-", ""), 10);
                return numA - numB;
            });

        const destDir = path.dirname(destPath);
        await mkdir(destDir, { recursive: true });

        const buffers: Buffer[] = [];
        for (const partName of sorted) {
            const partPath = path.join(multipartDir, partName);
            const partData = await readFile(partPath);
            buffers.push(partData);
        }

        const finalBuffer = Buffer.concat(buffers);
        await writeFile(destPath, finalBuffer);

        await rm(multipartDir, { recursive: true, force: true });
    }
}

function assertNoTraversal(segment: string): void {
    if (segment.includes("..") || segment.includes("/") || segment.includes("\\")) {
        throw new Error("Invalid path segment.");
    }
}

function assertPathContained(resolved: string, storagePath: string): void {
    const normalized = path.resolve(resolved);
    const root = path.resolve(storagePath);
    if (!normalized.startsWith(root + path.sep) && normalized !== root) {
        throw new Error("Path escapes storage root.");
    }
}

export const CompleteMultiPartUploadUseCaseImplementation =
    CompleteMultiPartUploadUseCase.createImplementation({
        implementation: CompleteMultiPartUploadUseCaseImpl,
        dependencies: [TenantContext]
    });
```

```typescript
/* packages/api-file-manager-server/src/features/CompleteMultiPartUpload/feature.ts */

import { createFeature } from "@webiny/feature/api";
import { CompleteMultiPartUploadUseCaseImplementation } from "./CompleteMultiPartUploadUseCase.js";

export const CompleteMultiPartUploadFeature = createFeature({
    name: "FileManagerServer/CompleteMultiPartUpload",
    register(container) {
        container.register(CompleteMultiPartUploadUseCaseImplementation);
    }
});
```

- [ ] **Step 4: Delete old graphql and multiPartUpload directories**

```bash
rm -rf packages/api-file-manager-server/src/graphql/
rm -rf packages/api-file-manager-server/src/multiPartUpload/
```

- [ ] **Step 5: Update `api-file-manager-server/src/index.ts`**

Remove `createServerGraphQLSchema` import and usage. Register the three new features:

```typescript
/* packages/api-file-manager-server/src/index.ts */

import { existsSync } from "node:fs";
import { mkdirSync } from "node:fs";
import { ContextPlugin } from "@webiny/api";
import { uploadRoutesPlugin } from "~/routes/uploadRoutes.js";
import { modifyFastifyPlugin } from "~/routes/uploadRoutes.js";
import { CleanupStaleMultipartUploadsFeature } from "~/features/CleanupStaleMultipartUploads/feature.js";
import { DeleteFileFromDiskFeature } from "~/features/DeleteFileFromDisk/feature.js";
import { ExtractMetadataFeature } from "~/features/ExtractMetadata/feature.js";
import { FlushCacheFeature } from "~/features/FlushCache/feature.js";
import { GetFileContentsByIdFeature } from "~/features/GetFileContentsById/feature.js";
import { GetFileContentsByKeyFeature } from "~/features/GetFileContentsByKey/feature.js";
import { GetUploadPayloadFeature } from "~/features/GetUploadPayload/feature.js";
import { CreateMultiPartUploadFeature } from "~/features/CreateMultiPartUpload/feature.js";
import { CompleteMultiPartUploadFeature } from "~/features/CompleteMultiPartUpload/feature.js";
export { createFileUploadModifier } from "@webiny/api-file-manager/features/upload/index.js";
export { createAssetDelivery } from "./assetDelivery/createAssetDelivery.js";

const contextPlugin = new ContextPlugin(context => {
    const storagePath = process.env["WEBINY_LOCAL_STORAGE_PATH"];
    if (!storagePath) {
        throw new Error(
            `"WEBINY_LOCAL_STORAGE_PATH" environment variable is not defined. Please set it to a valid local path.`
        );
    }

    const uploadSecret = process.env["WEBINY_UPLOAD_SECRET"];
    if (!uploadSecret) {
        throw new Error(
            `"WEBINY_UPLOAD_SECRET" environment variable is not defined. Please set it to a secret string used to sign upload tokens.`
        );
    }

    if (!existsSync(storagePath)) {
        mkdirSync(storagePath, { recursive: true });
    }

    const container = context.container;

    FlushCacheFeature.register(container);
    DeleteFileFromDiskFeature.register(container);
    ExtractMetadataFeature.register(container);
    GetFileContentsByIdFeature.register(container);
    GetFileContentsByKeyFeature.register(container);
    GetUploadPayloadFeature.register(container);
    CreateMultiPartUploadFeature.register(container);
    CompleteMultiPartUploadFeature.register(container);
    CleanupStaleMultipartUploadsFeature.register(container);
});

contextPlugin.name = `fileManagerServer.context`;

export const createFileManagerServer = () => [
    contextPlugin,
    uploadRoutesPlugin,
    modifyFastifyPlugin
];
```

- [ ] **Step 6: Delete `getPresignedPostPayload.ts` from server utils**

This file is no longer needed — the logic is now in `GetUploadPayloadUseCase`.

```bash
rm packages/api-file-manager-server/src/utils/getPresignedPostPayload.ts
```

Similarly, delete `packages/api-file-manager-s3/src/utils/getPresignedPostPayload.ts`.

- [ ] **Step 7: Build and test**

```bash
yarn build -p @webiny/api-file-manager-server 2>&1 | tail -10
yarn test packages/api-file-manager-server 2>&1 | tail -30
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat(api-file-manager-server): implement upload abstractions, remove old schema"
```

---

### Task 8: Move shared asset delivery transformation utils to base package

**Files:**
- Create: `packages/api-file-manager/src/features/assetDelivery/transformation/AssetKeyGenerator.ts`
- Create: `packages/api-file-manager/src/features/assetDelivery/transformation/CallableContentsReader.ts`
- Create: `packages/api-file-manager/src/features/assetDelivery/transformation/utils.ts`
- Create: `packages/api-file-manager/src/features/assetDelivery/transformation/WidthCollection.ts`
- Create: `packages/api-file-manager/src/features/assetDelivery/transformation/index.ts`
- Delete: `packages/api-file-manager-s3/src/assetDelivery/s3/transformation/` (all 4 files)
- Delete: `packages/api-file-manager-server/src/assetDelivery/transformation/` (all 4 files)
- Modify: S3 `SharpTransform.ts` and server `LocalSharpTransform.ts` imports

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: `AssetKeyGenerator`, `CallableContentsReader`, `transformationUtils`, `WidthCollection` — used by provider asset delivery classes

These four files are 100% identical (diff returned no output).

- [ ] **Step 1: Copy files to base package**

Copy all four files from `api-file-manager-s3/src/assetDelivery/s3/transformation/` to `packages/api-file-manager/src/features/assetDelivery/transformation/`.

- [ ] **Step 2: Create barrel export**

```typescript
/* packages/api-file-manager/src/features/assetDelivery/transformation/index.ts */

export { AssetKeyGenerator } from "./AssetKeyGenerator.js";
export { CallableContentsReader } from "./CallableContentsReader.js";
export { WidthCollection } from "./WidthCollection.js";
export {
    getOptimalWidth,
    getImageTransformExtension,
    supportedImageTypes,
    IMAGE_TRANSFORMER_SUPPORTED_IMAGES
} from "./utils.js";
```

- [ ] **Step 3: Delete old files from both provider packages**

```bash
rm -rf packages/api-file-manager-s3/src/assetDelivery/s3/transformation/
rm -rf packages/api-file-manager-server/src/assetDelivery/transformation/
```

- [ ] **Step 4: Update imports in provider packages**

In `packages/api-file-manager-s3/src/assetDelivery/s3/SharpTransform.ts`, update transformation imports to:

```typescript
import { AssetKeyGenerator } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { CallableContentsReader } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { WidthCollection } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { getOptimalWidth } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { getImageTransformExtension } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
```

Same for `packages/api-file-manager-server/src/assetDelivery/LocalSharpTransform.ts`.

- [ ] **Step 5: Build all three packages**

```bash
yarn build -p @webiny/api-file-manager 2>&1 | tail -10
yarn build -p @webiny/api-file-manager-s3 2>&1 | tail -10
yarn build -p @webiny/api-file-manager-server 2>&1 | tail -10
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "refactor(api-file-manager): move shared asset delivery transformation to base package"
```

---

### Task 9: Final verification — build, lint, test

**Files:** none (verification only)

**Interfaces:**
- Consumes: all changes from Tasks 1–8
- Produces: clean build + passing tests

- [ ] **Step 1: Run the full before-commit checklist**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
git add .
```

Fix any issues and re-run from the beginning if anything fails.

- [ ] **Step 2: Build all three packages**

```bash
yarn build -p @webiny/api-file-manager 2>&1 | tail -10
yarn build -p @webiny/api-file-manager-s3 2>&1 | tail -10
yarn build -p @webiny/api-file-manager-server 2>&1 | tail -10
```

- [ ] **Step 3: Run tests**

```bash
yarn test packages/api-file-manager 2>&1 | tail -30
yarn test packages/api-file-manager-server 2>&1 | tail -30
```

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: final cleanup after file manager common code extraction"
```

---

## Items NOT moved (and why)

These remain in provider packages because their implementations are fundamentally different:

| Feature | S3 | Server | Reason |
|---|---|---|---|
| `ExtractMetadataTask` | S3 `getObject` | `fs.readFile` | Different I/O |
| `GetFileContentsByIdUseCase` | S3 `getObject` | `fs.readFile` | Different I/O |
| `GetFileContentsByKeyUseCase` | S3 `getObject` | `fs.readFile` + content-type map | Different I/O |
| `DeleteFile` | `DeleteS3FolderTask` | `fs.rm` | Different I/O |
| `FlushCache` | CloudFront invalidation task | No-op handlers | Different behavior |
| Asset delivery impls | `S3AssetResolver`, `S3OutputStrategy`, etc. | `LocalAssetResolver`, `LocalOutputStrategy`, etc. | Different I/O |
| `uploadRoutes.ts` | N/A | HTTP upload routes | Server-only |
| `uploadToken.ts` | N/A | HMAC token generation | Server-only |
| `resolveServerUrl.ts` | N/A | URL resolution from request | Server-only |
| `CdnPathsGenerator.ts` | CDN path generation | N/A | S3-only |
| `threatDetection/` | S3 threat detection | N/A | S3/enterprise-only |

The `ExtractMetadataHandler` (event handler that triggers the task) _is_ identical, but it stays in provider packages since it's tightly coupled to the task definition it imports from. A future refactor could extract the handler and the `ExtractMetadataInput` interface to base, leaving only the task implementation in provider packages.
