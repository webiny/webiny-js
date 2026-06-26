# ServiceDiscovery Storage-Agnostic Refactor

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ServiceDiscovery` storage-agnostic by extracting the DDB-hardcoded loader into a pluggable `IServiceManifestLoader` interface, moving the class from `@webiny/api` to `@webiny/api-core`, and placing DDB/SQL implementations in their respective storage packages.

**Architecture:** `ServiceDiscovery` stays a static singleton (3/7 consumers lack DI container access). The internal `ServiceManifestLoader` with hardcoded DDB `QueryCommand` is replaced by an `IServiceManifestLoader` interface set via `ServiceDiscovery.setLoader(loader)`. DDB implementation goes to `api-core-ddb`, SQL to `api-core-sql`. Templates wire the loader at handler setup time. Calling `load()` without a registered loader throws.

**Tech Stack:** TypeScript, DynamoDB (`QueryCommand`/`unmarshall`), Knex (SQL), Vitest

---

## File Map

### Created

| File | Responsibility |
|------|----------------|
| `packages/api-core/src/features/serviceDiscovery/ServiceDiscovery.ts` | Static singleton class + `IServiceManifestLoader` interface |
| `packages/api-core/src/features/serviceDiscovery/index.ts` | Barrel export |
| `packages/api-core-ddb/src/serviceDiscovery/DdbServiceManifestLoader.ts` | DDB implementation of `IServiceManifestLoader` |
| `packages/api-core-ddb/src/serviceDiscovery/index.ts` | Barrel export |
| `packages/api-core-sql/src/serviceDiscovery/SqlServiceManifestLoader.ts` | SQL implementation of `IServiceManifestLoader` |
| `packages/api-core-sql/src/serviceDiscovery/index.ts` | Barrel export |
| `packages/api-core/src/features/serviceDiscovery/__tests__/ServiceDiscovery.test.ts` | Unit tests for the static class (loader plugging, caching, throw-on-no-loader) |
| `packages/api-core-ddb/src/serviceDiscovery/__tests__/DdbServiceManifestLoader.test.ts` | Integration test for DDB loader |

### Modified

| File | Change |
|------|--------|
| `packages/api/src/index.ts` | Remove `export * from "./ServiceDiscovery.js"` |
| `packages/api/src/ServiceDiscovery.ts` | Delete file |
| `packages/api/__tests__/ServiceDiscovery.test.ts` | Delete file (replaced by new test in api-core) |
| `packages/api-core-ddb/src/createApiCoreDdb.ts` | Call `ServiceDiscovery.setLoader(new DdbServiceManifestLoader(documentClient))` |
| `packages/api-core-ddb/src/index.ts` | Export serviceDiscovery barrel |
| `packages/api-core-sql/src/createApiCoreSql.ts` | Call `ServiceDiscovery.setLoader(new SqlServiceManifestLoader(knex, tableManager))` |
| `packages/api-core-sql/src/index.ts` | Export serviceDiscovery barrel |
| `packages/api-scheduler/src/manifest.ts` | Drop `setDocumentClient` call and `client` param, import from `@webiny/api-core` |
| `packages/api-scheduler/src/context.ts` | Drop DDB client cast, simplify `getManifest()` call |
| `packages/api-sync-system/src/sync/utils/manifest.ts` | Drop `setDocumentClient` call and `getDocumentClient` param, import from `@webiny/api-core` |
| `packages/api-sync-system/src/sync/requestPlugin.ts` | Drop `getDocumentClient` from params interface (if unused after manifest change) |
| `packages/background-tasks/src/api/service/StepFunctionServicePlugin.ts` | Update import from `@webiny/api` to `@webiny/api-core` |
| `packages/api-file-manager/src/features/settings/SettingsInstaller/SettingsInstaller.ts` | Update import |
| `packages/api-file-manager/src/domain/settings/validation.ts` | Update import |
| `packages/api-website-builder/src/features/nextjs/NextjsConfig.ts` | Update import |
| `packages/api-file-manager-s3/src/features/FlushCache/InvalidateCacheTask.ts` | Update import |
| `packages/api-sync-system/__tests__/sync/utils/manifest.test.ts` | Update to use `setLoader` + DDB loader |
| `packages/api-sync-system/__tests__/sync/requestPlugin.test.ts` | Update to use `setLoader` + DDB loader |
| `packages/api-sync-system/__tests__/sync/createSyncSystem.test.ts` | Update to use `setLoader` + DDB loader |

### Templates (in `packages/project-aws/_templates/` — also mirrored in `dist/_templates/`)

No template changes needed. Templates call `createApiCoreDdb({ documentClient })` or `createApiCoreSql({ knex })`, and those functions will now call `ServiceDiscovery.setLoader()` internally.

---

## Task 1: Create `IServiceManifestLoader` interface and `ServiceDiscovery` class in `api-core`

**Files:**
- Create: `packages/api-core/src/features/serviceDiscovery/ServiceDiscovery.ts`
- Create: `packages/api-core/src/features/serviceDiscovery/index.ts`

- [ ] **Step 1: Write the `ServiceDiscovery` class and interface**

```ts
/* packages/api-core/src/features/serviceDiscovery/ServiceDiscovery.ts */

import type { GenericRecord } from "@webiny/api/types.js";

export interface IServiceManifest {
    name: string;
    manifest: GenericRecord<string>;
}

export interface IServiceManifestLoader {
    load(): Promise<IServiceManifest[] | undefined>;
}

type Manifest = GenericRecord<string>;

export class ServiceDiscovery {
    private static loader: IServiceManifestLoader | undefined;
    private static manifest: Manifest | undefined;

    static setLoader(loader: IServiceManifestLoader): void {
        this.loader = loader;
    }

    static async load(): Promise<Manifest | undefined> {
        if (this.manifest) {
            return this.manifest;
        }

        if (!this.loader) {
            throw new Error(
                "ServiceDiscovery loader not configured. Call ServiceDiscovery.setLoader() before loading manifests."
            );
        }

        const manifests = await this.loader.load();

        if (!manifests) {
            return undefined;
        }

        this.manifest = manifests.reduce<Manifest>((acc, item) => {
            return { ...acc, [item.name]: item.manifest };
        }, {});

        return this.manifest;
    }

    static clear(): void {
        this.manifest = undefined;
    }
}
```

- [ ] **Step 2: Create the barrel export**

```ts
/* packages/api-core/src/features/serviceDiscovery/index.ts */

export { ServiceDiscovery } from "./ServiceDiscovery.js";
export type { IServiceManifestLoader, IServiceManifest } from "./ServiceDiscovery.js";
```

- [ ] **Step 3: Commit**

```bash
git add packages/api-core/src/features/serviceDiscovery/
git commit -m "feat(api-core): add storage-agnostic ServiceDiscovery with pluggable IServiceManifestLoader"
```

---

## Task 2: Write unit tests for `ServiceDiscovery`

**Files:**
- Create: `packages/api-core/src/features/serviceDiscovery/__tests__/ServiceDiscovery.test.ts`

These tests verify the static class behavior in isolation — no real DB needed. They use a mock loader.

- [ ] **Step 1: Write the test file**

```ts
/* packages/api-core/src/features/serviceDiscovery/__tests__/ServiceDiscovery.test.ts */

import { describe, it, expect, beforeEach } from "vitest";
import { ServiceDiscovery } from "../ServiceDiscovery.js";
import type { IServiceManifestLoader } from "../ServiceDiscovery.js";

describe("ServiceDiscovery", () => {
    beforeEach(() => {
        ServiceDiscovery.clear();
        /* Reset the loader between tests by setting a fresh one or leaving it for the test to set. */
    });

    it("should throw if no loader is set", async () => {
        /* Force-clear the loader. Since there is no public resetLoader, we re-import or use a trick. */
        /* setLoader with undefined is not allowed by the type, so we cast. */
        (ServiceDiscovery as any).loader = undefined;

        await expect(ServiceDiscovery.load()).rejects.toThrow(
            "ServiceDiscovery loader not configured"
        );
    });

    it("should load manifests and combine them by name", async () => {
        const loader: IServiceManifestLoader = {
            async load() {
                return [
                    { name: "api", manifest: { cloudfront: { distributionId: "123" } } },
                    { name: "core", manifest: { bucket: { name: "my-bucket" } } }
                ];
            }
        };

        ServiceDiscovery.setLoader(loader);

        const result = await ServiceDiscovery.load();

        expect(result).toEqual({
            api: { cloudfront: { distributionId: "123" } },
            core: { bucket: { name: "my-bucket" } }
        });
    });

    it("should cache the result and not call loader again", async () => {
        let callCount = 0;
        const loader: IServiceManifestLoader = {
            async load() {
                callCount++;
                return [{ name: "api", manifest: { url: "https://example.com" } }];
            }
        };

        ServiceDiscovery.setLoader(loader);

        await ServiceDiscovery.load();
        await ServiceDiscovery.load();
        await ServiceDiscovery.load();

        expect(callCount).toBe(1);
    });

    it("should return undefined when loader returns undefined", async () => {
        const loader: IServiceManifestLoader = {
            async load() {
                return undefined;
            }
        };

        ServiceDiscovery.setLoader(loader);

        const result = await ServiceDiscovery.load();
        expect(result).toBeUndefined();
    });

    it("should reload after clear()", async () => {
        let callCount = 0;
        const loader: IServiceManifestLoader = {
            async load() {
                callCount++;
                return [{ name: "api", manifest: { version: callCount } }];
            }
        };

        ServiceDiscovery.setLoader(loader);

        const first = await ServiceDiscovery.load();
        expect(first).toEqual({ api: { version: 1 } });

        ServiceDiscovery.clear();

        const second = await ServiceDiscovery.load();
        expect(second).toEqual({ api: { version: 2 } });
        expect(callCount).toBe(2);
    });
});
```

- [ ] **Step 2: Run tests**

```bash
yarn test packages/api-core --testPathPattern="serviceDiscovery" 2>&1 | tail -30
```

Expected: all 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add packages/api-core/src/features/serviceDiscovery/__tests__/
git commit -m "test(api-core): add ServiceDiscovery unit tests"
```

---

## Task 3: Create DDB manifest loader in `api-core-ddb`

**Files:**
- Create: `packages/api-core-ddb/src/serviceDiscovery/DdbServiceManifestLoader.ts`
- Create: `packages/api-core-ddb/src/serviceDiscovery/index.ts`
- Modify: `packages/api-core-ddb/src/createApiCoreDdb.ts`
- Modify: `packages/api-core-ddb/src/index.ts`

- [ ] **Step 1: Write the DDB loader**

This is the exact DDB logic extracted from the old `ServiceManifestLoader` in `packages/api/src/ServiceDiscovery.ts`.

```ts
/* packages/api-core-ddb/src/serviceDiscovery/DdbServiceManifestLoader.ts */

import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import {
    QueryCommand,
    unmarshall
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { IServiceManifestLoader } from "@webiny/api-core/features/serviceDiscovery/index.js";

export class DdbServiceManifestLoader implements IServiceManifestLoader {
    private readonly client: Pick<DynamoDBDocument, "send">;

    constructor(client: Pick<DynamoDBDocument, "send">) {
        this.client = client;
    }

    async load() {
        const { Items } = await this.client.send(
            new QueryCommand({
                TableName: String(process.env.DB_TABLE),
                IndexName: "GSI1",
                KeyConditionExpression: "GSI1_PK = :GSI1_PK AND GSI1_SK > :GSI1_SK",
                ExpressionAttributeValues: {
                    ":GSI1_PK": { S: "SERVICE_MANIFESTS" },
                    ":GSI1_SK": { S: " " }
                }
            })
        );

        if (!Array.isArray(Items)) {
            return undefined;
        }

        return Items.map(item => unmarshall(item).data);
    }
}
```

- [ ] **Step 2: Create barrel export**

```ts
/* packages/api-core-ddb/src/serviceDiscovery/index.ts */

export { DdbServiceManifestLoader } from "./DdbServiceManifestLoader.js";
```

- [ ] **Step 3: Wire the loader into `createApiCoreDdb`**

Modify `packages/api-core-ddb/src/createApiCoreDdb.ts`. Add the `ServiceDiscovery.setLoader()` call at the top of the function body, before returning storage operations.

The full file after editing:

```ts
/* packages/api-core-ddb/src/createApiCoreDdb.ts */

import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createStorageOperations as createUsersStorageOperations } from "./adminUsers/index.js";
import { createStorageOperations as createTenancyStorageOperations } from "./tenancy/index.js";
import { createStorageOperations as createSecurityStorageOperations } from "./security/index.js";
import { createStorageOperations as createKeyValueStorageOperations } from "./keyValueStore/index.js";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { DdbServiceManifestLoader } from "./serviceDiscovery/index.js";

interface CreateApiCoreDdbParams {
    documentClient: DynamoDBDocument;
}

export const createApiCoreDdb = ({
    documentClient
}: CreateApiCoreDdbParams): ApiCoreStorageOperations => {
    ServiceDiscovery.setLoader(new DdbServiceManifestLoader(documentClient));

    return {
        usersStorageOperations: createUsersStorageOperations({
            documentClient
        }),
        tenancyStorageOperations: createTenancyStorageOperations({
            documentClient
        }),
        securityStorageOperations: createSecurityStorageOperations({
            documentClient
        }),
        keyValueStorageOperations: createKeyValueStorageOperations({
            documentClient
        })
    };
};
```

- [ ] **Step 4: Export from `api-core-ddb` barrel**

Modify `packages/api-core-ddb/src/index.ts`:

```ts
export * from "./createApiCoreDdb.js";
export { DdbServiceManifestLoader } from "./serviceDiscovery/index.js";
```

- [ ] **Step 5: Commit**

```bash
git add packages/api-core-ddb/src/
git commit -m "feat(api-core-ddb): add DdbServiceManifestLoader, wire into createApiCoreDdb"
```

---

## Task 4: Create SQL manifest loader in `api-core-sql`

**Files:**
- Create: `packages/api-core-sql/src/serviceDiscovery/SqlServiceManifestLoader.ts`
- Create: `packages/api-core-sql/src/serviceDiscovery/index.ts`
- Modify: `packages/api-core-sql/src/createApiCoreSql.ts`
- Modify: `packages/api-core-sql/src/index.ts`

- [ ] **Step 1: Write the SQL loader**

The DDB schema stores manifests with `GSI1_PK = "SERVICE_MANIFESTS"` and the payload in `data: { name, manifest }`. The SQL equivalent is a `service_manifests` table with `name` and `manifest` (JSON) columns.

```ts
/* packages/api-core-sql/src/serviceDiscovery/SqlServiceManifestLoader.ts */

import type { Knex } from "knex";
import type { IServiceManifestLoader } from "@webiny/api-core/features/serviceDiscovery/index.js";
import type { TableManager } from "~/TableManager.js";

const TABLE_NAME = "webiny_service_manifests";

interface IServiceManifestRow {
    name: string;
    manifest: string;
}

export class SqlServiceManifestLoader implements IServiceManifestLoader {
    private readonly knex: Knex;
    private readonly tableManager: TableManager;

    constructor(knex: Knex, tableManager: TableManager) {
        this.knex = knex;
        this.tableManager = tableManager;
    }

    async load() {
        await this.ensureTable();

        const rows = await this.knex<IServiceManifestRow>(
            this.tableManager.resolve(TABLE_NAME)
        ).select("name", "manifest");

        if (!rows.length) {
            return undefined;
        }

        return rows.map(row => ({
            name: row.name,
            manifest: JSON.parse(row.manifest)
        }));
    }

    private async ensureTable() {
        await this.tableManager.ensure(TABLE_NAME, table => {
            table.text("name").primary().notNullable();
            table.text("manifest").notNullable();
        });
    }
}
```

- [ ] **Step 2: Create barrel export**

```ts
/* packages/api-core-sql/src/serviceDiscovery/index.ts */

export { SqlServiceManifestLoader } from "./SqlServiceManifestLoader.js";
```

- [ ] **Step 3: Wire the loader into `createApiCoreSql`**

Modify `packages/api-core-sql/src/createApiCoreSql.ts`. The full file after editing:

```ts
/* packages/api-core-sql/src/createApiCoreSql.ts */

import type { Knex } from "knex";
import type { ApiCoreStorageOperations } from "@webiny/api-core/types/core.js";
import { createStorageOperations as createUsersStorageOperations } from "./adminUsers/index.js";
import { createStorageOperations as createTenancyStorageOperations } from "./tenancy/index.js";
import { createStorageOperations as createSecurityStorageOperations } from "./security/index.js";
import { createStorageOperations as createKeyValueStorageOperations } from "./keyValueStore/index.js";
import { TableManager } from "./TableManager.js";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { SqlServiceManifestLoader } from "./serviceDiscovery/index.js";

interface CreateApiCoreSqlParams {
    knex: Knex;
    tableNamePrefix?: string;
}

export const createApiCoreSql = ({
    knex,
    tableNamePrefix
}: CreateApiCoreSqlParams): ApiCoreStorageOperations => {
    const tableManager = new TableManager(knex, tableNamePrefix);

    ServiceDiscovery.setLoader(new SqlServiceManifestLoader(knex, tableManager));

    return {
        usersStorageOperations: createUsersStorageOperations({
            knex,
            tableManager
        }),
        tenancyStorageOperations: createTenancyStorageOperations({
            knex,
            tableManager
        }),
        securityStorageOperations: createSecurityStorageOperations({
            knex,
            tableManager
        }),
        keyValueStorageOperations: createKeyValueStorageOperations({
            knex,
            tableManager
        })
    };
};
```

- [ ] **Step 4: Export from `api-core-sql` barrel**

Modify `packages/api-core-sql/src/index.ts`:

```ts
export { createApiCoreSql } from "./createApiCoreSql.js";
export { getSqlTablePrefix } from "./getSqlTablePrefix.js";
export { SqlServiceManifestLoader } from "./serviceDiscovery/index.js";
```

- [ ] **Step 5: Commit**

```bash
git add packages/api-core-sql/src/
git commit -m "feat(api-core-sql): add SqlServiceManifestLoader, wire into createApiCoreSql"
```

---

## Task 5: Remove `ServiceDiscovery` from `@webiny/api`

**Files:**
- Delete: `packages/api/src/ServiceDiscovery.ts`
- Delete: `packages/api/__tests__/ServiceDiscovery.test.ts`
- Modify: `packages/api/src/index.ts`

- [ ] **Step 1: Remove the barrel export**

In `packages/api/src/index.ts`, remove this line:

```ts
export * from "./ServiceDiscovery.js";
```

The file should become:

```ts
export * from "./Context.js";
export * from "./decorateContext.js";
export * from "./createConditionalPluginFactory.js";
export * from "./plugins/ContextPlugin.js";
export * from "./helpers/InterfaceGenerator/index.js";
```

- [ ] **Step 2: Delete the old files**

```bash
rm packages/api/src/ServiceDiscovery.ts
rm packages/api/__tests__/ServiceDiscovery.test.ts
```

- [ ] **Step 3: Commit**

```bash
git add packages/api/src/ServiceDiscovery.ts packages/api/src/index.ts packages/api/__tests__/ServiceDiscovery.test.ts
git commit -m "refactor(api): remove ServiceDiscovery (moved to api-core)"
```

---

## Task 6: Update `api-scheduler` — drop DDB coupling from manifest loading

**Files:**
- Modify: `packages/api-scheduler/src/manifest.ts`
- Modify: `packages/api-scheduler/src/context.ts`

The `getManifest` function currently takes a `{ client: DynamoDBDocument }` param, calls `ServiceDiscovery.setDocumentClient(client)`, then loads. After this change, it takes no params — `ServiceDiscovery` already has its loader from template setup.

- [ ] **Step 1: Simplify `manifest.ts`**

The full file after editing:

```ts
/* packages/api-scheduler/src/manifest.ts */

import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { createZodError } from "@webiny/utils";
import zod from "zod";

const schema = zod.object({
    scheduler: zod.object({
        lambdaArn: zod.string(),
        roleArn: zod.string()
    })
});

export interface IGetManifestErrorResult {
    error: Error;
    data?: never;
}

export interface IGetManifestSuccessResult {
    data: {
        lambdaArn: string;
        roleArn: string;
    };
    error?: never;
}

export type IGetManifestResult = IGetManifestSuccessResult | IGetManifestErrorResult;

export const getManifest = async (): Promise<IGetManifestResult> => {
    try {
        const manifest = await ServiceDiscovery.load();
        if (!manifest) {
            return {
                error: new Error("Manifest could not be loaded.")
            };
        } else if (!manifest.scheduler) {
            return {
                error: new Error("Scheduler not found in the Manifest.")
            };
        }

        const result = await schema.safeParseAsync(manifest);
        if (!result.success) {
            return {
                error: createZodError(result.error)
            };
        }

        return {
            data: result.data.scheduler
        };
    } catch (ex) {
        return {
            error: ex
        };
    }
};
```

- [ ] **Step 2: Simplify `context.ts`**

Remove the DDB client cast and the `client` param from the `getManifest` call. Change line 39-41 from:

```ts
const manifest = await getManifest({
    client: context.db.driver.getClient() as DynamoDBDocument
});
```

To:

```ts
const manifest = await getManifest();
```

Also remove the unused import of `DynamoDBDocument` (line 9):

```ts
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
```

And remove the `IGetManifestParams` interface import if it was used. The `getManifest` no longer has params, so `IGetManifestParams` can be deleted from `manifest.ts` as well — it's already absent in the updated file above.

- [ ] **Step 3: Verify the `api-scheduler` package still has no `@webiny/aws-sdk/client-dynamodb` imports in `context.ts`**

```bash
grep -n "client-dynamodb" packages/api-scheduler/src/context.ts
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add packages/api-scheduler/src/manifest.ts packages/api-scheduler/src/context.ts
git commit -m "refactor(api-scheduler): use storage-agnostic ServiceDiscovery from api-core"
```

---

## Task 7: Update `api-sync-system` — drop DDB coupling from manifest loading

**Files:**
- Modify: `packages/api-sync-system/src/sync/utils/manifest.ts`

The `getManifest` function currently takes `{ getDocumentClient(): ... }` and calls `ServiceDiscovery.setDocumentClient()`. Drop that — just call `ServiceDiscovery.load()`.

- [ ] **Step 1: Simplify `manifest.ts`**

The full file after editing:

```ts
/* packages/api-sync-system/src/sync/utils/manifest.ts */

import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import zod from "zod";
import { createZodError } from "@webiny/utils";

const validateManifest = zod.object({
    sync: zod.object({
        eventBusArn: zod.string(),
        eventBusName: zod.string(),
        region: zod.string()
    })
});

export const getManifest = async () => {
    try {
        const manifest = await ServiceDiscovery.load();
        if (!manifest?.sync) {
            return {
                error: new Error(
                    "Sync System Manifest not found. Probably Sync System is not turned on."
                )
            };
        }
        const { data, error } = validateManifest.safeParse(manifest);
        if (error) {
            const err = createZodError(error);
            return {
                error: err
            };
        }
        return {
            data
        };
    } catch (ex) {
        return {
            error: ex
        };
    }
};
```

- [ ] **Step 2: Update `requestPlugin.ts` if `getDocumentClient` was only used for manifest loading**

In `packages/api-sync-system/src/sync/requestPlugin.ts`, the `getManifest(params)` call currently forwards `params` which contains `getDocumentClient`. After the manifest change, `getManifest()` takes no params:

Change line 21 from:

```ts
const { data: manifest, error } = await getManifest(params);
```

To:

```ts
const { data: manifest, error } = await getManifest();
```

Check if `getDocumentClient` is still used elsewhere in the file (it is — `attachToDynamoDbDocument` may need it). If `getDocumentClient` is still used by other parts of `requestPlugin.ts`, keep it in the params interface but it's no longer passed to `getManifest`. If it's NOT used anywhere else in the file, remove it from `ICreateSyncSystemHandlerOnRequestPluginParams`.

**Important:** Do NOT remove `getDocumentClient` from the params interface if other parts of the sync system (like `attachToDynamoDbDocument`) still need it — only remove the manifest's dependency on it.

- [ ] **Step 3: Commit**

```bash
git add packages/api-sync-system/src/sync/
git commit -m "refactor(api-sync-system): use storage-agnostic ServiceDiscovery from api-core"
```

---

## Task 8: Update remaining consumers — import path changes

These 4 consumers only call `ServiceDiscovery.load()` (they never called `setDocumentClient`). The only change is the import path: `@webiny/api` → `@webiny/api-core/features/serviceDiscovery/index.js`.

**Files:**
- Modify: `packages/background-tasks/src/api/service/StepFunctionServicePlugin.ts`
- Modify: `packages/api-file-manager/src/features/settings/SettingsInstaller/SettingsInstaller.ts`
- Modify: `packages/api-file-manager/src/domain/settings/validation.ts`
- Modify: `packages/api-website-builder/src/features/nextjs/NextjsConfig.ts`
- Modify: `packages/api-file-manager-s3/src/features/FlushCache/InvalidateCacheTask.ts`

- [ ] **Step 1: Update each file's import**

In each file, replace:

```ts
import { ServiceDiscovery } from "@webiny/api";
```

With:

```ts
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
```

Files to update:
1. `packages/background-tasks/src/api/service/StepFunctionServicePlugin.ts` (line 15)
2. `packages/api-file-manager/src/features/settings/SettingsInstaller/SettingsInstaller.ts` (line 1)
3. `packages/api-file-manager/src/domain/settings/validation.ts` (line 2)
4. `packages/api-website-builder/src/features/nextjs/NextjsConfig.ts` (line 4)
5. `packages/api-file-manager-s3/src/features/FlushCache/InvalidateCacheTask.ts` (line 1)

- [ ] **Step 2: Verify no remaining imports of `ServiceDiscovery` from `@webiny/api`**

```bash
grep -rn "ServiceDiscovery.*from.*@webiny/api\"" packages/ --include="*.ts" | grep -v node_modules | grep -v ".d.ts" | grep -v __generated | grep -v api-core
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add packages/background-tasks/ packages/api-file-manager/ packages/api-website-builder/ packages/api-file-manager-s3/
git commit -m "refactor: update ServiceDiscovery imports to @webiny/api-core"
```

---

## Task 9: Update `api-sync-system` test files

**Files:**
- Modify: `packages/api-sync-system/__tests__/sync/utils/manifest.test.ts`
- Modify: `packages/api-sync-system/__tests__/sync/requestPlugin.test.ts`
- Modify: `packages/api-sync-system/__tests__/sync/createSyncSystem.test.ts`

These tests currently call `ServiceDiscovery.setDocumentClient(client)` and `ServiceDiscovery.clear()`. They need to use `ServiceDiscovery.setLoader(new DdbServiceManifestLoader(client))` and `ServiceDiscovery.clear()`.

- [ ] **Step 1: Update test imports and setup**

In each test file, replace:

```ts
import { ServiceDiscovery } from "@webiny/api";
```

With:

```ts
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";
import { DdbServiceManifestLoader } from "@webiny/api-core-ddb";
```

And replace each `beforeEach` / setup block's:

```ts
ServiceDiscovery.setDocumentClient(client);
ServiceDiscovery.clear();
```

With:

```ts
ServiceDiscovery.setLoader(new DdbServiceManifestLoader(client));
ServiceDiscovery.clear();
```

Files:
1. `packages/api-sync-system/__tests__/sync/utils/manifest.test.ts` (lines 1, 11-12)
2. `packages/api-sync-system/__tests__/sync/requestPlugin.test.ts` (lines 11, 23-24)
3. `packages/api-sync-system/__tests__/sync/createSyncSystem.test.ts` (lines 4, 18-19)

- [ ] **Step 2: Fix manifest.test.ts — the ServiceDiscovery.load mock**

In `packages/api-sync-system/__tests__/sync/utils/manifest.test.ts` around line 107-120, there's a test that monkey-patches `ServiceDiscovery.load`. This test still works as-is since `ServiceDiscovery.load` is a static method on the new class too. Just verify the import path is updated.

- [ ] **Step 3: Update the `getManifest` call in `requestPlugin.test.ts`**

If the test was passing params to `getManifest` that included `getDocumentClient`, and `getManifest` no longer accepts params, the test needs to be updated accordingly. The `getDocumentClient` was only needed for `ServiceDiscovery.setDocumentClient` — which is now handled by `setLoader` in `beforeEach`.

- [ ] **Step 4: Run the sync-system tests**

```bash
yarn test packages/api-sync-system 2>&1 | tail -50
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/api-sync-system/__tests__/
git commit -m "test(api-sync-system): update tests to use ServiceDiscovery.setLoader"
```

---

## Task 10: Build, lint, and verify

**Files:** None (verification only)

- [ ] **Step 1: Run the before-commit checklist**

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

If any step fails, fix and re-run from the beginning.

- [ ] **Step 2: Build affected packages**

```bash
yarn build -p @webiny/api-core 2>&1 | tail -30
yarn build -p @webiny/api-core-ddb 2>&1 | tail -30
yarn build -p @webiny/api-core-sql 2>&1 | tail -30
yarn build -p @webiny/api 2>&1 | tail -30
yarn build -p @webiny/api-scheduler 2>&1 | tail -30
yarn build -p @webiny/api-sync-system 2>&1 | tail -30
yarn build -p @webiny/api-file-manager 2>&1 | tail -30
yarn build -p @webiny/api-website-builder 2>&1 | tail -30
yarn build -p @webiny/api-file-manager-s3 2>&1 | tail -30
yarn build -p @webiny/api-background-tasks 2>&1 | tail -30
```

- [ ] **Step 3: Run tests for affected packages**

Run sequentially, not in parallel:

```bash
yarn test packages/api-core --testPathPattern="serviceDiscovery" 2>&1 | tail -30
yarn test packages/api-scheduler 2>&1 | tail -50
yarn test packages/api-sync-system 2>&1 | tail -50
```

- [ ] **Step 4: Verify no circular dependencies**

```bash
npx tsx scripts/circularDependencyCheck.ts 2>&1 | tail -20
```

Expected: no circular dependency involving `api-core`, `api-core-ddb`, or `api-core-sql`.

- [ ] **Step 5: Final commit if any fixups were needed**

```bash
git add .
git commit -m "chore: fix lint/format/dependency issues from ServiceDiscovery refactor"
```

---

## Notes for implementer

- **`@webiny/aws-sdk` dep removal from `@webiny/api`:** After deleting `ServiceDiscovery.ts`, check if `@webiny/api` still has other imports from `@webiny/aws-sdk`. If not, remove `@webiny/aws-sdk` from its `package.json` dependencies. Run `yarn adio` to verify.
- **`dist/_templates`:** The `dist/` copies of templates are auto-generated. Do not modify them manually. They will be updated on the next build/publish cycle.
- **SQL manifest table:** The `webiny_service_manifests` table schema (`name TEXT PK`, `manifest TEXT`) is minimal. The DDB data shape has `data: { name, manifest }` — the SQL loader stores `manifest` as a JSON string and parses on read. If no rows exist, `load()` returns `undefined`, and `ServiceDiscovery.load()` returns `undefined` (not throw — the throw is only for missing *loader*, not missing *data*).
- **`api-sync-system` `getDocumentClient` param:** After removing it from the manifest flow, grep the entire `api-sync-system/src/sync/` directory for other `getDocumentClient` usages. The `attachToDynamoDbDocument` function likely still needs it, so keep it in the params interface — just stop passing it to `getManifest`.
