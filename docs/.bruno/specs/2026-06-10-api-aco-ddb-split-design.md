# Split api-aco: Extract DynamoDB Storage into api-aco-ddb

## Goal

The `@webiny/api-aco` base package must have zero knowledge of DynamoDB (or any specific storage backend). All DynamoDB-specific code moves to a new `@webiny/api-aco-ddb` package. The base package uses DI abstractions to resolve storage implementations at runtime.

## Current State

DynamoDB touches in `api-aco`:

| File | DDB dependency | Action |
|---|---|---|
| `flp/flp.so.ts` | `createTable`, `createStandardEntity` from `@webiny/db-dynamodb` | Move to `api-aco-ddb` |
| `createAcoStorageOperations.ts` | Takes `documentClient`, assembles filter + flp SO | Remove |
| `createAcoContext.ts` | Passes `documentClient` through | Remove param |
| `index.ts` (`createAco`) | Takes `documentClient` in params | Remove param |
| `utils/createOperationsWrapper.ts` | Type references `documentClient` (unused at runtime) | Clean up type |
| `filter/filter.so.ts` | None (uses CMS APIs) | Stays, update param type |

## Design

### DI Abstraction Token

Create a `FlpStorageOperations` DI abstraction in `api-aco` using `createAbstraction`, following the exact pattern of `FilterStorageOperations` in `features/folder/shared/abstractions.ts`:

```ts
export const FlpStorageOperations =
    createAbstraction<IAcoStorageOperations["flp"]>("FlpStorageOperations");

export namespace FlpStorageOperations {
    export type Interface = IAcoStorageOperations["flp"];
}
```

Location: `features/folder/shared/abstractions.ts`, alongside the existing `FilterStorageOperations` token (both are storage abstractions consumed by the same `setupAcoContext` code).

### Runtime Flow

```
registerAcoDdbStorageOperations({ documentClient })   // api-aco-ddb extension plugin
createAco()                                            // api-aco (no params)
  -> setupAcoContext(context)
    -> context.container.resolve(FlpStorageOperations)  // resolves DDB impl
    -> createFilterOperations({ cms, security, container }) // internal, CMS-based
    -> assembles AcoStorageOperations { filter, flp }
```

Plugin execution order is safe: `registerAcoDdbStorageOperations` uses `createRegisterExtensionPlugin`, which runs during the extension registration phase. `createAcoContext` is a `ContextPlugin`, which runs later during context setup. This is the same lifecycle pattern as `registerDynamoDbStorageOperations()` / `createHeadlessCmsContext()`.

### api-aco Changes

**Remove `createAcoStorageOperations.ts`.**
Its work is absorbed into `setupAcoContext`:
- Filter SO: call `createFilterOperations({ cms, security, container })` directly.
- FLP SO: `context.container.resolve(FlpStorageOperations)`.
- Assemble `AcoStorageOperations` from both.

**`index.ts`** — `createAco()` takes no params. The `CreateAcoParams` interface is removed entirely (`documentClient` is extracted, `useFolderLevelPermissions` is dead code — never read inside `setupAcoContext`, which uses `context.wcp.canUseFolderLevelPermissions()` instead).

**`createAcoContext.ts`** — `CreateAcoContextParams` is removed (both `documentClient` and the unused `useFolderLevelPermissions` are gone). `setupAcoContext` takes only `context` and resolves FLP SO from the container.

**`flp/index.ts`** — Remove `export * from "./flp.so.js"` (the file moves to `api-aco-ddb`). Keep `export * from "./flp.crud.js"` and `export * from "./tasks/index.js"`.

**`filter/filter.so.ts`** — `createFilterOperations` param type changes from `CreateAcoStorageOperationsParams` (deleted with `createAcoStorageOperations.ts`) to a new local interface:

```ts
interface CreateFilterOperationsParams {
    cms: HeadlessCms;
    security: Security;
    container: Container;
}
```

Defined at the top of `filter/filter.so.ts`.

**`utils/createOperationsWrapper.ts`** — Same treatment: replace `CreateAcoStorageOperationsParams` import with a local interface containing only `{ cms, security }` (what it actually uses). The `CreateOperationsWrapperParams` extends this local type instead.

**`package.json`** — Remove `@webiny/aws-sdk` and `@webiny/db-dynamodb` from dependencies.

**`tsconfig.build.json`** — Remove references to `aws-sdk` and `db-dynamodb`.

### New api-aco-ddb Package

**`src/FolderLevelPermissionsStorageOperations.ts`**
The `FolderLevelPermissionsStorageOperations` class from `api-aco/src/flp/flp.so.ts`, moved verbatim. The class is exported (it was module-private before; the old `createFlpOperations` factory is not carried over — instantiation happens in `registerAcoDdbStorageOperations`). Imports reference `@webiny/api-aco` for interface types (`AcoFolderLevelPermissionsStorageOperations`, `StorageOperations*Params`, `FolderLevelPermission`).

**`src/index.ts`**
Exports `registerAcoDdbStorageOperations({ documentClient })` which returns a `createRegisterExtensionPlugin` that:
1. Creates a `FolderLevelPermissionsStorageOperations` instance with the given `documentClient`.
2. Registers it into the container against the `FlpStorageOperations` abstraction token from `@webiny/api-aco`.

**`package.json`**
```json
{
  "name": "@webiny/api-aco-ddb",
  "dependencies": {
    "@webiny/api-aco": "0.0.0",
    "@webiny/aws-sdk": "0.0.0",
    "@webiny/db-dynamodb": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/handler": "0.0.0",
    "@webiny/utils": "0.0.0"
  }
}
```

Standard `webiny.config.js`, `tsconfig.json`, `tsconfig.build.json` following `api-core-ddb` as a template.

### App Template Changes

Both `appTemplates/api/graphql/src/index.ts` and `extensions/OpenSearch/api/graphql/src/index.ts`:

```ts
import { registerAcoDdbStorageOperations } from "@webiny/api-aco-ddb";

// In plugins array, before createAco():
registerAcoDdbStorageOperations({ documentClient }),
createAco(),
```

The `extensions/sqlite` template changes to `createAco()` (dropping the experimental `{ knex }` param). A future `api-aco-sql` package will provide the SQL FLP storage implementation.

### Test Handler Files

The following test utility files call `createAco({ documentClient })` and must be updated to register the DDB plugin separately:

- `packages/api-aco/__tests__/utils/useHandler.ts`
- `packages/api-aco/__tests__/utils/useGraphQlHandler.ts`
- `packages/api-headless-cms-aco/__tests__/utils/useGraphQlHandler.ts`
- `packages/api-file-manager-aco/__tests__/utils/useGraphQlHandler.ts`
- `packages/api-audit-logs/__tests__/helpers/handlerCore.ts`

Each file adds `registerAcoDdbStorageOperations({ documentClient })` before `createAco()` in its plugin array. The test specs themselves are unchanged.

### Unchanged

- `flp/flp.types.ts` — interfaces are storage-agnostic.
- `flp/flp.crud.ts` — consumes `AcoStorageOperations` interface.
- `filter/filter.crud.ts`, `filter/filter.types.ts` — unchanged.
- All features under `features/`.
- All GraphQL, tasks, domain code.
- All test specs (only test handler utilities change).

## Risks

- **Plugin ordering**: `registerAcoDdbStorageOperations` must run before `createAco()` in the plugins array. This is the same constraint as `registerDynamoDbStorageOperations()` / `createHeadlessCmsContext()` and is enforced by array position.
- **External consumers**: Any package that imports `createAco` with `{ documentClient }` will get a type error. The fix is mechanical: add `api-aco-ddb` and register the plugin separately. Known consumers: app templates + test handlers (all updated in this change).
