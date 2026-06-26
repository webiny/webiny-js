# File Manager GraphQL Layer DI Refactoring

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the two DI violations in the `api-file-manager` GraphQL layer: inline classes in `getFileByUrl.ts` and missing `FileUrlGenerator` implementation.

**Architecture:** Extract the manually-instantiated `GetFileByUrlUseCase` / `SecureGetFileByUrl` classes into a proper DI feature. Implement the already-defined `FileUrlGenerator` abstraction to replace the inline `FmFile.src` resolver logic. Wire both into the existing GraphQL setup.

**Tech Stack:** TypeScript, `@webiny/feature/api` (createAbstraction/createImplementation/createFeature)

## Global Constraints

- ES modules only, one named import per line, one class per file.
- Comments end with period; `//` single-line, `/* */` multi-line. No `/** */`.
- No `export default`. `Impl` suffix on class names; exported `const` matches abstraction name.
- `public`/`protected`/`private` + `readonly` on all class properties.
- No one-liners with `await` + `return` — assign to `const`, then return.
- Build: `yarn build -p @webiny/api-file-manager --safe-replace 2>&1 | tail -30`
- Test: `yarn test packages/api-file-manager 2>&1 | tail -50`

---

### Task 1: Implement `FileUrlGenerator` feature

The abstraction exists at `src/features/file/FileUrlGenerator/abstractions.ts` but has no implementation. The `FmFile.src` resolver in `filesSchema.ts:33-38` resolves `GetSettingsUseCase` inline and prepends `srcPrefix` to `file.key` on every call. Move this into a proper implementation.

**Files:**
- Modify: `src/features/file/FileUrlGenerator/abstractions.ts` (fix broken `File` import — currently references global DOM `File`)
- Create: `src/features/file/FileUrlGenerator/FileUrlGenerator.ts`
- Create: `src/features/file/FileUrlGenerator/feature.ts`
- Create: `src/features/file/FileUrlGenerator/index.ts`
- Modify: `src/features/FileManagerFeature.ts` (register the new feature)

**Interfaces:**
- Consumes: `GetSettingsUseCase` — `execute(): Promise<Result<FileManagerSettings, Error>>`
- Produces: `FileUrlGenerator` — `generateUrl(file: File): string` (consumed by Task 3)

- [ ] **Step 1: Fix the abstraction import and scope token**

In `src/features/file/FileUrlGenerator/abstractions.ts`, replace the full file:

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { File } from "~/domain/file/types.js";

interface IFileUrlGenerator {
    generateUrl(file: File): string;
}

/* Generate URLs for uploaded files. */
export const FileUrlGenerator = createAbstraction<IFileUrlGenerator>("FileManager/FileUrlGenerator");

export namespace FileUrlGenerator {
    export type Interface = IFileUrlGenerator;
}
```

- [ ] **Step 2: Create the implementation**

Create `src/features/file/FileUrlGenerator/FileUrlGenerator.ts`:

```typescript
import { FileUrlGenerator as Abstraction } from "./abstractions.js";
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
import type { File } from "~/domain/file/types.js";

class FileUrlGeneratorImpl implements Abstraction.Interface {
    private srcPrefix = "";

    public constructor(private readonly getSettings: GetSettingsUseCase.Interface) {}

    public generateUrl(file: File): string {
        return this.srcPrefix + file.key;
    }

    public async init(): Promise<void> {
        const result = await this.getSettings.execute();
        const settings = result.value;
        this.srcPrefix = settings?.srcPrefix ?? "";
    }
}

export const FileUrlGenerator = Abstraction.createImplementation({
    implementation: FileUrlGeneratorImpl,
    dependencies: [GetSettingsUseCase]
});
```

- [ ] **Step 3: Create the feature**

Create `src/features/file/FileUrlGenerator/feature.ts`:

```typescript
import { createFeature } from "@webiny/feature/api";
import { FileUrlGenerator } from "./FileUrlGenerator.js";

export const FileUrlGeneratorFeature = createFeature({
    name: "FileManager/FileUrlGenerator",
    register(container) {
        container.register(FileUrlGenerator).inSingletonScope();
    }
});
```

- [ ] **Step 4: Create the index export**

Create `src/features/file/FileUrlGenerator/index.ts`:

```typescript
export { FileUrlGenerator } from "./abstractions.js";
```

- [ ] **Step 5: Register in FileManagerFeature**

In `src/features/FileManagerFeature.ts`, add the import:

```typescript
import { FileUrlGeneratorFeature } from "~/features/file/FileUrlGenerator/feature.js";
```

Add inside the `register` function body:

```typescript
FileUrlGeneratorFeature.register(container);
```

- [ ] **Step 6: Build and test**

```bash
yarn build -p @webiny/api-file-manager --safe-replace 2>&1 | tail -30
yarn test packages/api-file-manager 2>&1 | tail -50
```

- [ ] **Step 7: Commit**

```
feat(api-file-manager): implement FileUrlGenerator feature
```

---

### Task 2: Extract `GetFileByUrl` into a DI feature

`src/graphql/getFileByUrl.ts` defines two inline classes — `GetFileByUrlUseCase` and `SecureGetFileByUrl` — instantiated with `new` inside a resolver. Extract into a proper feature. The security check moves into the use case itself (like `CreateFileUseCase` uses `FmPermissions`).

**Files:**
- Create: `src/features/file/GetFileByUrl/abstractions.ts`
- Create: `src/features/file/GetFileByUrl/GetFileByUrlUseCase.ts`
- Create: `src/features/file/GetFileByUrl/feature.ts`
- Create: `src/features/file/GetFileByUrl/index.ts`
- Modify: `src/features/FileManagerFeature.ts` (register)
- Modify: `src/exports/api/file-manager/file.ts` (add public export)

**Interfaces:**
- Consumes: `ListFilesUseCase` — `execute(input): Promise<Result<ListFilesOutput, Error>>`
- Consumes: `IdentityContext` from `@webiny/api-core`
- Produces: `GetFileByUrlUseCase` — `execute(url: string): Promise<Result<File | undefined, Error>>` (consumed by Task 3)

- [ ] **Step 1: Create the abstractions**

Create `src/features/file/GetFileByUrl/abstractions.ts`:

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { File } from "~/domain/file/types.js";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";

export interface IGetFileByUrlUseCase {
    execute(url: string): Promise<Result<File | undefined, UseCaseError>>;
}

export interface IGetFileByUrlUseCaseErrors {
    notAuthorized: FileNotAuthorizedError;
}

type UseCaseError = IGetFileByUrlUseCaseErrors[keyof IGetFileByUrlUseCaseErrors];

/* Retrieve a file by its public URL. */
export const GetFileByUrlUseCase =
    createAbstraction<IGetFileByUrlUseCase>("GetFileByUrlUseCase");

export namespace GetFileByUrlUseCase {
    export type Interface = IGetFileByUrlUseCase;
    export type Error = UseCaseError;
}
```

- [ ] **Step 2: Create the implementation**

Create `src/features/file/GetFileByUrl/GetFileByUrlUseCase.ts`:

```typescript
import { Result } from "@webiny/feature/api";
import { GetFileByUrlUseCase as Abstraction } from "./abstractions.js";
import { ListFilesUseCase } from "~/features/file/ListFiles/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";
import type { File } from "~/domain/file/types.js";

class GetFileByUrlUseCaseImpl implements Abstraction.Interface {
    public constructor(
        private readonly identityContext: IdentityContext.Interface,
        private readonly listFiles: ListFilesUseCase.Interface
    ) {}

    public async execute(url: string): Promise<Result<File | undefined, Abstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (!identity) {
            return Result.fail(new FileNotAuthorizedError());
        }

        const { pathname } = new URL(url);
        const query = pathname.replace("/files/", "").replace("/private/", "");

        const filesResult = await this.listFiles.execute({
            where: { key: query },
            limit: 1
        });

        if (filesResult.isFail()) {
            return Result.ok(undefined);
        }

        const files = filesResult.value.items;
        const file = files.length ? files[0] : undefined;

        return Result.ok(file);
    }
}

export const GetFileByUrlUseCase = Abstraction.createImplementation({
    implementation: GetFileByUrlUseCaseImpl,
    dependencies: [IdentityContext, ListFilesUseCase]
});
```

- [ ] **Step 3: Create the feature and index**

Create `src/features/file/GetFileByUrl/feature.ts`:

```typescript
import { createFeature } from "@webiny/feature/api";
import { GetFileByUrlUseCase } from "./GetFileByUrlUseCase.js";

export const GetFileByUrlFeature = createFeature({
    name: "FileManager/GetFileByUrl",
    register(container) {
        container.register(GetFileByUrlUseCase);
    }
});
```

Create `src/features/file/GetFileByUrl/index.ts`:

```typescript
export { GetFileByUrlUseCase } from "./abstractions.js";
```

- [ ] **Step 4: Register in FileManagerFeature**

In `src/features/FileManagerFeature.ts`, add the import:

```typescript
import { GetFileByUrlFeature } from "~/features/file/GetFileByUrl/feature.js";
```

Add inside the `register` function body:

```typescript
GetFileByUrlFeature.register(container);
```

- [ ] **Step 5: Add public export**

In `src/exports/api/file-manager/file.ts`, add:

```typescript
export { GetFileByUrlUseCase } from "~/features/file/GetFileByUrl/abstractions.js";
```

- [ ] **Step 6: Build and test**

```bash
yarn build -p @webiny/api-file-manager --safe-replace 2>&1 | tail -30
yarn test packages/api-file-manager 2>&1 | tail -50
```

- [ ] **Step 7: Commit**

```
feat(api-file-manager): extract GetFileByUrl into DI feature
```

---

### Task 3: Wire new features into GraphQL layer and clean up

Update the three GraphQL files to use the new DI features instead of inline logic. The resolver functions stay as they are (thin `context.container.resolve()` delegates) — only the two violations are fixed.

**Files:**
- Modify: `src/graphql/filesSchema.ts` (replace `FmFile.src` resolver)
- Modify: `src/graphql/getFileByUrl.ts` (full rewrite — delete inline classes, use `GetFileByUrlUseCase`)
- Modify: `src/graphql/index.ts` (init `FileUrlGenerator` in ContextPlugin)
- Modify: `src/graphql/utils.ts` (remove unused `resolve` helper)

**Interfaces:**
- Consumes: `FileUrlGenerator` (Task 1), `GetFileByUrlUseCase` (Task 2)

- [ ] **Step 1: Update `FmFile.src` in `filesSchema.ts`**

In `src/graphql/filesSchema.ts`, replace the `FmFile` resolver block (lines 32-39):

```typescript
            FmFile: {
                async src(file, _, context) {
                    // TODO: create `FileUrlGenerator` service to use here
                    const getSettings = context.container.resolve(GetSettingsUseCase);
                    const result = await getSettings.execute();
                    const settings = result.value;
                    return (settings?.srcPrefix || "") + file.key;
                }
            },
```

With:

```typescript
            FmFile: {
                src(file, _, context) {
                    const urlGenerator = context.container.resolve(FileUrlGenerator);
                    return urlGenerator.generateUrl(file);
                }
            },
```

Update the imports at the top of the file — remove `GetSettingsUseCase`, add `FileUrlGenerator`:

Remove:
```typescript
import { GetSettingsUseCase } from "~/features/settings/GetSettings/abstractions.js";
```

Add:
```typescript
import { FileUrlGenerator } from "~/features/file/FileUrlGenerator/abstractions.js";
```

Also remove the now-unused `FileModel` import if it's only used in the removed resolver. Check — `FileModel` is NOT used in `filesSchema.ts` resolvers (it's used in `createFilesTypeDefs` via params), so remove this import line:

```typescript
import { FileModel } from "~/domain/file/abstractions.js";
```

- [ ] **Step 2: Rewrite `getFileByUrl.ts`**

Replace the entire contents of `src/graphql/getFileByUrl.ts`:

```typescript
import { ErrorResponse, GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { Response, NotFoundResponse } from "@webiny/handler-graphql";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { GetFileByUrlUseCase } from "~/features/file/GetFileByUrl/abstractions.js";

export const getFileByUrl = () => {
    const fileManagerGraphQL = new GraphQLSchemaPlugin<ApiCoreContext>({
        typeDefs: /* GraphQL */ `
            extend type FmQuery {
                getFileByUrl(url: String!): FmFileResponse
            }
        `,
        resolvers: {
            FmQuery: {
                async getFileByUrl(_, args, context) {
                    const { url } = args as { url: string };
                    const useCase = context.container.resolve(GetFileByUrlUseCase);
                    const result = await useCase.execute(url);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    if (!result.value) {
                        return new NotFoundResponse("File not found!");
                    }

                    return new Response(result.value);
                }
            }
        }
    });
    fileManagerGraphQL.name = "fm.graphql.getFileByUrl";

    return fileManagerGraphQL;
};
```

- [ ] **Step 3: Init `FileUrlGenerator` in `graphql/index.ts`**

In `src/graphql/index.ts`, the `FileUrlGenerator` needs its `init()` called so that `srcPrefix` is loaded before resolvers run. Add inside the `ContextPlugin` callback, after the `withoutAuthorization` block opens but before the schema plugins are created.

Add the import:

```typescript
import { FileUrlGenerator } from "~/features/file/FileUrlGenerator/abstractions.js";
```

Inside the `withoutAuthorization` callback, before the `createGraphQLSchemaPluginFromFieldPlugins` call, add:

```typescript
                const fileUrlGenerator = context.container.resolve(FileUrlGenerator);
                if (typeof (fileUrlGenerator as any).init === "function") {
                    await (fileUrlGenerator as any).init();
                }
```

**Note:** The `init()` method is on the implementation, not the interface. We cast to `any` to call it. This is a one-time setup call in the composition root — acceptable here. If you prefer, you can add `init?(): Promise<void>` to the `IFileUrlGenerator` interface instead and skip the cast.

- [ ] **Step 4: Clean up `utils.ts`**

In `src/graphql/utils.ts`, remove the `resolve` function and its imports (lines 1, 3-19). Keep only:

```typescript
export const emptyResolver = () => ({});
```

Verify no file still imports `resolve`:

```bash
grep -r "resolve.*from.*graphql/utils" packages/api-file-manager/src/ --include="*.ts"
```

Should return zero results.

- [ ] **Step 5: Build and run full test suite**

```bash
yarn build -p @webiny/api-file-manager --safe-replace 2>&1 | tail -30
yarn test packages/api-file-manager 2>&1 | tail -50
```

All existing tests must pass — the GraphQL API surface is unchanged.

- [ ] **Step 6: Commit**

```
refactor(api-file-manager): wire FileUrlGenerator and GetFileByUrl into graphql layer
```
