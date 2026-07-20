# api-sync-to-opensearch Package Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `@webiny/api-sync-to-opensearch` into a platform-agnostic base package (OpenSearch-only) and a DynamoDB-specific adapter package (`@webiny/api-sync-ddb-to-opensearch`), with full DI using abstraction/implementation/feature pattern.

**Architecture:** Base package defines all OpenSearch sync abstractions (Operations, OperationsBuilder, ExecuteSync, ExecuteSyncWithRetry, SynchronizationBuilder) and provides implementations for the OpenSearch-only parts. DDB adapter package provides DDB-specific implementations and a composite feature that registers everything. Timer abstraction added to `@webiny/utils`.

**Tech Stack:** `@webiny/feature` (createAbstraction, createFeature, createImplementation), `@webiny/di` (Container, Abstraction), `@webiny/api-opensearch`, `p-retry`, vitest

## Global Constraints

- All abstractions use `createAbstraction<T>(token)` from `@webiny/feature/api`
- All implementations use `Abstraction.createImplementation({ implementation, dependencies })`
- All features use `createFeature({ name, register(container, ...) })` from `@webiny/feature/api`
- Namespace pattern: `export namespace X { export type Interface = IX; }`
- Import paths use `.js` extensions (ESM)
- Package versions are `"0.0.0"`
- No backward compatibility shims
- Base package must have zero AWS imports

**Spec:** `docs/.bruno/specs/2026-07-15-api-sync-to-opensearch-split-design.md`

---

### Task 1: Timer Abstraction in `@webiny/utils`

**Files:**
- Create: `packages/utils/src/features/Timer/abstraction.ts`
- Create: `packages/utils/src/features/Timer/feature.ts`

**Interfaces:**
- Consumes: `createAbstraction` from `@webiny/feature/api`; `createFeature` from `@webiny/feature/api`
- Produces: `Timer` abstraction token, `Timer.Interface` type, `TimerFeature` feature

- [ ] **Step 1: Create Timer abstraction**

Create `packages/utils/src/features/Timer/abstraction.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";

export interface ITimer {
    getRemainingSeconds(): number;
}

export const Timer = createAbstraction<ITimer>("Timer");

export namespace Timer {
    export type Interface = ITimer;
}
```

- [ ] **Step 2: Create TimerFeature**

Create `packages/utils/src/features/Timer/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { Timer } from "./abstraction.js";

export const TimerFeature = createFeature<Timer.Interface>({
    name: "utils.timer",
    register(container, timer) {
        container.registerInstance(Timer, timer);
    }
});
```

- [ ] **Step 3: Verify build**

Run: `yarn build -p @webiny/utils 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/utils/src/features/Timer/
git commit -m "feat(utils): add Timer abstraction and TimerFeature"
```

---

### Task 2: Base Package — Operations Abstraction + Implementation

**Files:**
- Create: `packages/api-sync-to-opensearch/src/features/Operations/abstraction.ts`
- Create: `packages/api-sync-to-opensearch/src/features/Operations/implementation.ts`

**Interfaces:**
- Consumes: `createAbstraction` from `@webiny/feature/api`; `GenericRecord` from `@webiny/api/types.js`
- Produces: `Operations` abstraction token, `Operations.Interface`, `IInsertOperationParams`, `IModifyOperationParams`, `IDeleteOperationParams`, `OperationsImpl` class, `OperationType` enum

- [ ] **Step 1: Create Operations abstraction**

Create `packages/api-sync-to-opensearch/src/features/Operations/abstraction.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IInsertOperationParams {
    id: string;
    index: string;
    data: GenericRecord;
}

export type IModifyOperationParams = IInsertOperationParams;

export interface IDeleteOperationParams {
    id: string;
    index: string;
}

export interface IOperations {
    items: GenericRecord[];
    total: number;
    count: number;
    clear(): void;
    insert(params: IInsertOperationParams): void;
    modify(params: IModifyOperationParams): void;
    delete(params: IDeleteOperationParams): void;
}

export const Operations = createAbstraction<IOperations>("Sync/Operations");

export namespace Operations {
    export type Interface = IOperations;
}
```

- [ ] **Step 2: Create Operations implementation**

Create `packages/api-sync-to-opensearch/src/features/Operations/implementation.ts`:

Move the existing `Operations` class from `src/Operations.ts`. This class is not registered via feature — it is instantiated directly by consumers since each needs its own instance.

```ts
import type { GenericRecord } from "@webiny/api/types.js";
import type {
    IDeleteOperationParams,
    IInsertOperationParams,
    IModifyOperationParams,
    IOperations
} from "./abstraction.js";

export enum OperationType {
    INSERT = "INSERT",
    MODIFY = "MODIFY",
    REMOVE = "REMOVE"
}

export class OperationsImpl implements IOperations {
    private _items: GenericRecord[] = [];
    private _count = 0;

    public get items(): GenericRecord[] {
        return this._items;
    }

    public get total(): number {
        return this.items.length;
    }

    public get count(): number {
        return this._count;
    }

    public clear() {
        this._items = [];
        this._count = 0;
    }

    public insert(params: IInsertOperationParams): void {
        this._count++;
        this.items.push(
            {
                index: {
                    _id: params.id,
                    _index: params.index
                }
            },
            params.data
        );
    }

    public modify(params: IModifyOperationParams): void {
        this.insert(params);
    }

    public delete(params: IDeleteOperationParams): void {
        this._count++;
        this.items.push({
            delete: {
                _id: params.id,
                _index: params.index
            }
        });
    }
}
```

- [ ] **Step 3: Update Operations test import**

Edit `packages/api-sync-to-opensearch/__tests__/Operations.test.ts` — change import:

```ts
// Before
import { Operations } from "~/Operations";

// After
import { OperationsImpl as Operations } from "~/features/Operations/implementation";
```

- [ ] **Step 4: Run test**

Run: `yarn test packages/api-sync-to-opensearch --testPathPattern="Operations.test" 2>&1 | tail -20`
Expected: All 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/api-sync-to-opensearch/src/features/Operations/ packages/api-sync-to-opensearch/__tests__/Operations.test.ts
git commit -m "feat(api-sync-to-opensearch): add Operations abstraction and implementation"
```

---

### Task 3: Base Package — OperationsBuilder Abstraction

**Files:**
- Create: `packages/api-sync-to-opensearch/src/features/OperationsBuilder/abstraction.ts`

**Interfaces:**
- Consumes: `Operations.Interface` from Task 2
- Produces: `OperationsBuilder` abstraction token, `OperationsBuilder.Interface<TRecord>`, `IOperationsBuilderBuildParams<TRecord>`

- [ ] **Step 1: Create OperationsBuilder abstraction**

Create `packages/api-sync-to-opensearch/src/features/OperationsBuilder/abstraction.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { Operations } from "../Operations/abstraction.js";

export interface IOperationsBuilderBuildParams<TRecord = unknown> {
    records: TRecord[];
}

export interface IOperationsBuilder<TRecord = unknown> {
    build(params: IOperationsBuilderBuildParams<TRecord>): Promise<Operations.Interface>;
}

export const OperationsBuilder = createAbstraction<IOperationsBuilder>("Sync/OperationsBuilder");

export namespace OperationsBuilder {
    export type Interface<TRecord = unknown> = IOperationsBuilder<TRecord>;
}
```

No implementation in base — each adapter provides its own.

- [ ] **Step 2: Verify build**

Run: `yarn build -p @webiny/api-sync-to-opensearch 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add packages/api-sync-to-opensearch/src/features/OperationsBuilder/
git commit -m "feat(api-sync-to-opensearch): add OperationsBuilder abstraction"
```

---

### Task 4: Base Package — ExecuteSync Abstraction + Implementation + Feature

**Files:**
- Create: `packages/api-sync-to-opensearch/src/features/ExecuteSync/abstraction.ts`
- Create: `packages/api-sync-to-opensearch/src/features/ExecuteSync/implementation.ts`
- Create: `packages/api-sync-to-opensearch/src/features/ExecuteSync/feature.ts`

**Interfaces:**
- Consumes: `Timer.Interface` from Task 1; `OpenSearchClient` from `@webiny/api-opensearch`; `Operations.Interface` from Task 2
- Produces: `ExecuteSync` abstraction token, `ExecuteSync.Interface`, `ExecuteSync.Params`, `ExecuteSyncFeature`

- [ ] **Step 1: Create ExecuteSync abstraction**

Create `packages/api-sync-to-opensearch/src/features/ExecuteSync/abstraction.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { Timer } from "@webiny/utils/features/Timer/abstraction.js";
import type { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import type { Operations } from "../Operations/abstraction.js";

export interface IExecuteSyncParams {
    timer: Timer.Interface;
    maxRunningTime: number;
    maxProcessorPercent: number;
    openSearchClient: OpenSearchClient.Client;
    operations: Pick<Operations.Interface, "items" | "total">;
}

export interface IExecuteSync {
    execute(params: IExecuteSyncParams): Promise<void>;
}

export const ExecuteSync = createAbstraction<IExecuteSync>("Sync/ExecuteSync");

export namespace ExecuteSync {
    export type Interface = IExecuteSync;
    export type Params = IExecuteSyncParams;
}
```

- [ ] **Step 2: Create ExecuteSync implementation**

Create `packages/api-sync-to-opensearch/src/features/ExecuteSync/implementation.ts`:

Move the logic from the existing `src/execute.ts` into a class implementing `IExecuteSync`. The `execute` method wraps the existing `execute()` factory function body.

```ts
import {
    createWaitUntilHealthy,
    OpenSearchCatClusterHealthStatus,
    UnhealthyClusterError,
    WaitingHealthyClusterAbortedError
} from "@webiny/api-opensearch";
import type { ApiResponse } from "@webiny/api-opensearch/types.js";
import { WebinyError } from "@webiny/error";
import { shouldShowLogs } from "~/helpers/shouldShowLogs.js";
import type { IExecuteSync, IExecuteSyncParams } from "./abstraction.js";
import { ExecuteSync } from "./abstraction.js";

interface BulkOperationsResponseBodyItemIndexError {
    reason?: string;
}

interface BulkOperationsResponseBodyItemIndex {
    error?: BulkOperationsResponseBodyItemIndexError;
}

interface BulkOperationsResponseBodyItem {
    index?: BulkOperationsResponseBodyItemIndex;
    error?: string;
}

const getError = (item: BulkOperationsResponseBodyItem): string | null => {
    if (!item.index?.error?.reason) {
        return null;
    }
    const reason = item.index.error.reason;
    if (reason.match(/no such index \[([a-zA-Z0-9_-]+)\]/) !== null) {
        return "index";
    }
    return reason;
};

const checkErrors = (result?: ApiResponse): void => {
    if (!result || !result.body || !result.body.items) {
        return;
    }
    for (const item of result.body.items) {
        const err = getError(item);
        if (!err) {
            continue;
        } else if (err === "index") {
            if (process.env.DEBUG === "true") {
                console.error("Bulk response", JSON.stringify(result, null, 2));
            }
            continue;
        }
        console.error("Body item with error", item);
        throw new WebinyError(err, "DYNAMODB_TO_OPENSEARCH_ERROR", item);
    }
};

class ExecuteSyncImpl implements IExecuteSync {
    public async execute(params: IExecuteSyncParams): Promise<void> {
        const { openSearchClient, timer, maxRunningTime, maxProcessorPercent, operations } = params;

        if (operations.total === 0) {
            return;
        }

        const remainingTime = timer.getRemainingSeconds();
        const runningTime = maxRunningTime - remainingTime;
        const maxWaitingTime = remainingTime - 90;

        if (shouldShowLogs()) {
            console.debug(
                `The Lambda is already running for ${runningTime}s. Setting Health Check max waiting time: ${maxWaitingTime}s`
            );
        }

        const healthCheck = createWaitUntilHealthy(openSearchClient, {
            minClusterHealthStatus: OpenSearchCatClusterHealthStatus.Yellow,
            waitingTimeStep: 30,
            maxProcessorPercent,
            maxWaitingTime
        });

        try {
            await healthCheck.wait({
                async onUnhealthy({ startedAt, runs, mustEndAt, waitingTimeStep, waitingReason }) {
                    console.debug(`Cluster is unhealthy on run #${runs}.`, {
                        startedAt,
                        mustEndAt,
                        waitingTimeStep,
                        waitingReason
                    });
                },
                async onTimeout({ startedAt, runs, waitingTimeStep, mustEndAt, waitingReason }) {
                    console.error(`Cluster health check timeout on run #${runs}.`, {
                        startedAt,
                        mustEndAt,
                        waitingTimeStep,
                        waitingReason
                    });
                }
            });
        } catch (ex) {
            if (
                ex instanceof UnhealthyClusterError ||
                ex instanceof WaitingHealthyClusterAbortedError
            ) {
                throw ex;
            }
            console.error(`Cluster health check failed.`, ex);
            throw ex;
        }

        try {
            const res = await openSearchClient.bulk({
                body: operations.items
            });
            checkErrors(res);
        } catch (error) {
            console.error(error, { tenant: "root" });

            if (shouldShowLogs()) {
                const meta = error?.meta || {};
                delete meta["meta"];
                console.error("Bulk error", JSON.stringify(error, null, 2));
            }
            throw error;
        }
        if (shouldShowLogs()) {
            console.info(`Transferred ${operations.total} record operations to OpenSearch.`);
        }
    }
}

export const ExecuteSyncImplementation = ExecuteSync.createImplementation({
    implementation: ExecuteSyncImpl,
    dependencies: []
});
```

- [ ] **Step 3: Create ExecuteSyncFeature**

Create `packages/api-sync-to-opensearch/src/features/ExecuteSync/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ExecuteSyncImplementation } from "./implementation.js";

export const ExecuteSyncFeature = createFeature({
    name: "sync.executeSync",
    register(container) {
        container.register(ExecuteSyncImplementation);
    }
});
```

- [ ] **Step 4: Verify build**

Run: `yarn build -p @webiny/api-sync-to-opensearch 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/api-sync-to-opensearch/src/features/ExecuteSync/
git commit -m "feat(api-sync-to-opensearch): add ExecuteSync abstraction, implementation, and feature"
```

---

### Task 5: Base Package — ExecuteSyncWithRetry Abstraction + Implementation + Feature

**Files:**
- Create: `packages/api-sync-to-opensearch/src/features/ExecuteSyncWithRetry/abstraction.ts`
- Create: `packages/api-sync-to-opensearch/src/features/ExecuteSyncWithRetry/implementation.ts`
- Create: `packages/api-sync-to-opensearch/src/features/ExecuteSyncWithRetry/feature.ts`

**Interfaces:**
- Consumes: `ExecuteSync` abstraction from Task 4; `Timer.Interface` from Task 1; `NotEnoughRemainingTimeError` from existing file; `getNumberEnvVariable` from existing helper
- Produces: `ExecuteSyncWithRetry` abstraction token, `ExecuteSyncWithRetry.Interface`, `ExecuteSyncWithRetry.Params`, `ExecuteSyncWithRetryFeature`

- [ ] **Step 1: Create ExecuteSyncWithRetry abstraction**

Create `packages/api-sync-to-opensearch/src/features/ExecuteSyncWithRetry/abstraction.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { ExecuteSync } from "../ExecuteSync/abstraction.js";

export interface IExecuteSyncWithRetryParams
    extends Omit<ExecuteSync.Params, "maxProcessorPercent"> {
    maxRetryTime?: number;
    retries?: number;
    minTimeout?: number;
    maxTimeout?: number;
    maxProcessorPercent?: number;
}

export interface IExecuteSyncWithRetry {
    execute(params: IExecuteSyncWithRetryParams): Promise<void>;
}

export const ExecuteSyncWithRetry = createAbstraction<IExecuteSyncWithRetry>(
    "Sync/ExecuteSyncWithRetry"
);

export namespace ExecuteSyncWithRetry {
    export type Interface = IExecuteSyncWithRetry;
    export type Params = IExecuteSyncWithRetryParams;
}
```

- [ ] **Step 2: Create ExecuteSyncWithRetry implementation**

Create `packages/api-sync-to-opensearch/src/features/ExecuteSyncWithRetry/implementation.ts`:

Move the logic from existing `src/executeWithRetry.ts`. Resolves `ExecuteSync` from container.

```ts
import type { Container } from "@webiny/feature/api";
import pRetry from "p-retry";
import { ExecuteSync } from "../ExecuteSync/abstraction.js";
import { NotEnoughRemainingTimeError } from "~/NotEnoughRemainingTimeError.js";
import { getNumberEnvVariable } from "~/helpers/getNumberEnvVariable.js";
import type { IExecuteSyncWithRetry, IExecuteSyncWithRetryParams } from "./abstraction.js";
import { ExecuteSyncWithRetry } from "./abstraction.js";

const minRemainingSecondsToTimeout = 120;

const MAX_PROCESSOR_PERCENT = getNumberEnvVariable(
    "MAX_ES_PROCESSOR",
    process.env.NODE_ENV === "test" ? 101 : 98
);

class ExecuteSyncWithRetryImpl implements IExecuteSyncWithRetry {
    public constructor(private readonly executeSync: ExecuteSync.Interface) {}

    public async execute(params: IExecuteSyncWithRetryParams): Promise<void> {
        const maxRetryTime = getNumberEnvVariable(
            "WEBINY_DYNAMODB_TO_OPENSEARCH_MAX_RETRY_TIME",
            params.maxRetryTime || 300000
        );
        const retries = getNumberEnvVariable(
            "WEBINY_DYNAMODB_TO_OPENSEARCH_RETRIES",
            params.retries || 20
        );
        const minTimeout = getNumberEnvVariable(
            "WEBINY_DYNAMODB_TO_OPENSEARCH_MIN_TIMEOUT",
            params.minTimeout || 1500
        );
        const maxTimeout = getNumberEnvVariable(
            "WEBINY_DYNAMODB_TO_OPENSEARCH_MAX_TIMEOUT",
            params.maxTimeout || 30000
        );

        try {
            await pRetry(
                async () => {
                    await this.executeSync.execute({
                        timer: params.timer,
                        maxRunningTime: params.maxRunningTime,
                        maxProcessorPercent:
                            params.maxProcessorPercent || MAX_PROCESSOR_PERCENT,
                        openSearchClient: params.openSearchClient,
                        operations: params.operations
                    });
                },
                {
                    maxRetryTime,
                    retries,
                    minTimeout,
                    maxTimeout,
                    onFailedAttempt: ({ error, attemptNumber }) => {
                        if (params.timer.getRemainingSeconds() < minRemainingSecondsToTimeout) {
                            throw new NotEnoughRemainingTimeError(error);
                        }
                        if (attemptNumber < retries * 0.75) {
                            return;
                        }
                        console.error(`Attempt #${attemptNumber} failed.`);
                        console.error(error);
                    }
                }
            );
        } catch (ex) {
            throw ex;
        }
    }
}

export const ExecuteSyncWithRetryImplementation = ExecuteSyncWithRetry.createImplementation({
    implementation: ExecuteSyncWithRetryImpl,
    dependencies: [ExecuteSync]
});
```

- [ ] **Step 3: Create ExecuteSyncWithRetryFeature**

Create `packages/api-sync-to-opensearch/src/features/ExecuteSyncWithRetry/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ExecuteSyncWithRetryImplementation } from "./implementation.js";

export const ExecuteSyncWithRetryFeature = createFeature({
    name: "sync.executeSyncWithRetry",
    register(container) {
        container.register(ExecuteSyncWithRetryImplementation);
    }
});
```

- [ ] **Step 4: Verify build**

Run: `yarn build -p @webiny/api-sync-to-opensearch 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/api-sync-to-opensearch/src/features/ExecuteSyncWithRetry/
git commit -m "feat(api-sync-to-opensearch): add ExecuteSyncWithRetry abstraction, implementation, and feature"
```

---

### Task 6: Base Package — SynchronizationBuilder Abstraction + Implementation + Feature

**Files:**
- Create: `packages/api-sync-to-opensearch/src/features/SynchronizationBuilder/abstraction.ts`
- Create: `packages/api-sync-to-opensearch/src/features/SynchronizationBuilder/implementation.ts`
- Create: `packages/api-sync-to-opensearch/src/features/SynchronizationBuilder/feature.ts`

**Interfaces:**
- Consumes: `Operations` abstraction from Task 2 (instantiates `OperationsImpl`); `ExecuteSyncWithRetry` from Task 5; `Timer` from Task 1; `OpenSearchClient` from `@webiny/api-opensearch`
- Produces: `SynchronizationBuilder` abstraction token, `SynchronizationBuilder.Interface`, `SynchronizationBuilderFeature`

- [ ] **Step 1: Create SynchronizationBuilder abstraction**

Create `packages/api-sync-to-opensearch/src/features/SynchronizationBuilder/abstraction.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type {
    IInsertOperationParams,
    IDeleteOperationParams,
    IModifyOperationParams
} from "../Operations/abstraction.js";
import type { ExecuteSyncWithRetry } from "../ExecuteSyncWithRetry/abstraction.js";

export interface ISynchronizationBuilder {
    insert(params: IInsertOperationParams): void;
    modify(params: IModifyOperationParams): void;
    delete(params: IDeleteOperationParams): void;
    build(): (params?: Partial<ExecuteSyncWithRetry.Params>) => Promise<void>;
}

export const SynchronizationBuilder = createAbstraction<ISynchronizationBuilder>(
    "Sync/SynchronizationBuilder"
);

export namespace SynchronizationBuilder {
    export type Interface = ISynchronizationBuilder;
}
```

- [ ] **Step 2: Create SynchronizationBuilder implementation**

Create `packages/api-sync-to-opensearch/src/features/SynchronizationBuilder/implementation.ts`:

Move logic from existing `src/SynchronizationBuilder.ts`. Resolves Timer, OpenSearchClient, and ExecuteSyncWithRetry from container.

```ts
import type {
    IInsertOperationParams,
    IModifyOperationParams,
    IDeleteOperationParams
} from "../Operations/abstraction.js";
import { OperationsImpl } from "../Operations/implementation.js";
import { Timer } from "@webiny/utils/features/Timer/abstraction.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import {
    ExecuteSyncWithRetry,
    type IExecuteSyncWithRetryParams
} from "../ExecuteSyncWithRetry/abstraction.js";
import type { ISynchronizationBuilder } from "./abstraction.js";
import { SynchronizationBuilder } from "./abstraction.js";

class SynchronizationBuilderImpl implements ISynchronizationBuilder {
    private readonly operations = new OperationsImpl();

    public constructor(
        private readonly timer: Timer.Interface,
        private readonly openSearchClient: OpenSearchClient.Interface,
        private readonly executeSyncWithRetry: ExecuteSyncWithRetry.Interface
    ) {}

    public insert(params: IInsertOperationParams): void {
        this.operations.insert(params);
    }

    public modify(params: IModifyOperationParams): void {
        this.operations.modify(params);
    }

    public delete(params: IDeleteOperationParams): void {
        this.operations.delete(params);
    }

    public build() {
        return async (params?: Partial<IExecuteSyncWithRetryParams>) => {
            if (this.operations.total === 0) {
                return;
            }
            await this.executeSyncWithRetry.execute({
                ...params,
                maxRunningTime: this.timer.getRemainingSeconds(),
                timer: this.timer,
                openSearchClient: this.openSearchClient.use(),
                operations: this.operations
            });
            this.operations.clear();
        };
    }
}

export const SynchronizationBuilderImplementation = SynchronizationBuilder.createImplementation({
    implementation: SynchronizationBuilderImpl,
    dependencies: [Timer, OpenSearchClient, ExecuteSyncWithRetry]
});
```

- [ ] **Step 3: Create SynchronizationBuilderFeature**

Create `packages/api-sync-to-opensearch/src/features/SynchronizationBuilder/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { SynchronizationBuilderImplementation } from "./implementation.js";

export const SynchronizationBuilderFeature = createFeature({
    name: "sync.synchronizationBuilder",
    register(container) {
        container.register(SynchronizationBuilderImplementation);
    }
});
```

- [ ] **Step 4: Verify build**

Run: `yarn build -p @webiny/api-sync-to-opensearch 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add packages/api-sync-to-opensearch/src/features/SynchronizationBuilder/
git commit -m "feat(api-sync-to-opensearch): add SynchronizationBuilder abstraction, implementation, and feature"
```

---

### Task 7: Base Package — Update Barrel Export + Clean Up Old Files

**Files:**
- Modify: `packages/api-sync-to-opensearch/src/index.ts`
- Delete: `packages/api-sync-to-opensearch/src/Operations.ts`
- Delete: `packages/api-sync-to-opensearch/src/OperationsBuilder.ts`
- Delete: `packages/api-sync-to-opensearch/src/SynchronizationBuilder.ts`
- Delete: `packages/api-sync-to-opensearch/src/execute.ts`
- Delete: `packages/api-sync-to-opensearch/src/executeWithRetry.ts`
- Delete: `packages/api-sync-to-opensearch/src/types.ts`
- Delete: `packages/api-sync-to-opensearch/src/marshall.ts`
- Delete: `packages/api-sync-to-opensearch/src/DdbToEsLambdaHandler.ts`
- Delete: `packages/api-sync-to-opensearch/src/createDdbToEsStreamHandler.ts`
- Modify: `packages/api-sync-to-opensearch/package.json` (remove AWS deps)
- Modify: `packages/api-sync-to-opensearch/tsconfig.json` (remove AWS refs)
- Modify: `packages/api-sync-to-opensearch/tsconfig.build.json` (remove AWS refs)

**Interfaces:**
- Consumes: All features from Tasks 2-6
- Produces: Clean barrel export with only base package abstractions and features

- [ ] **Step 1: Rewrite barrel export**

Replace `packages/api-sync-to-opensearch/src/index.ts` with:

```ts
export { Operations, type IOperations, type IInsertOperationParams, type IModifyOperationParams, type IDeleteOperationParams } from "./features/Operations/abstraction.js";
export { OperationsImpl, OperationType } from "./features/Operations/implementation.js";
export { OperationsBuilder, type IOperationsBuilder, type IOperationsBuilderBuildParams } from "./features/OperationsBuilder/abstraction.js";
export { ExecuteSync, type IExecuteSync, type IExecuteSyncParams } from "./features/ExecuteSync/abstraction.js";
export { ExecuteSyncFeature } from "./features/ExecuteSync/feature.js";
export { ExecuteSyncWithRetry, type IExecuteSyncWithRetry, type IExecuteSyncWithRetryParams } from "./features/ExecuteSyncWithRetry/abstraction.js";
export { ExecuteSyncWithRetryFeature } from "./features/ExecuteSyncWithRetry/feature.js";
export { SynchronizationBuilder, type ISynchronizationBuilder } from "./features/SynchronizationBuilder/abstraction.js";
export { SynchronizationBuilderFeature } from "./features/SynchronizationBuilder/feature.js";
export { NotEnoughRemainingTimeError } from "./NotEnoughRemainingTimeError.js";
```

- [ ] **Step 2: Delete old source files**

Delete the following files that have been superseded by the new feature structure or will move to the DDB adapter:

```bash
rm packages/api-sync-to-opensearch/src/Operations.ts
rm packages/api-sync-to-opensearch/src/OperationsBuilder.ts
rm packages/api-sync-to-opensearch/src/SynchronizationBuilder.ts
rm packages/api-sync-to-opensearch/src/execute.ts
rm packages/api-sync-to-opensearch/src/executeWithRetry.ts
rm packages/api-sync-to-opensearch/src/types.ts
rm packages/api-sync-to-opensearch/src/marshall.ts
rm packages/api-sync-to-opensearch/src/DdbToEsLambdaHandler.ts
rm packages/api-sync-to-opensearch/src/createDdbToEsStreamHandler.ts
```

- [ ] **Step 3: Update package.json — remove AWS dependencies**

Edit `packages/api-sync-to-opensearch/package.json`. Remove these from `dependencies`:

- `"@webiny/aws-sdk": "0.0.0"`
- `"@webiny/event-handler-aws": "0.0.0"`
- `"@webiny/event-handler-core": "0.0.0"`
- `"@webiny/handler-aws": "0.0.0"`

Keep:
```json
{
    "@webiny/api": "0.0.0",
    "@webiny/api-opensearch": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/utils": "0.0.0",
    "p-retry": "^8.0.0"
}
```

Also update `"description"` to: `"Platform-agnostic OpenSearch synchronization with DI abstractions."`

- [ ] **Step 4: Update tsconfig.json — remove AWS path mappings and references**

Edit `packages/api-sync-to-opensearch/tsconfig.json`:

Remove these references:
```json
{ "path": "../aws-sdk" },
{ "path": "../event-handler-aws" },
{ "path": "../event-handler-core" },
{ "path": "../handler-aws" },
{ "path": "../plugins" }
```

Remove these path mappings:
```
"@webiny/aws-sdk/*", "@webiny/aws-sdk"
"@webiny/event-handler-aws/*", "@webiny/event-handler-aws"
"@webiny/event-handler-core/*", "@webiny/event-handler-core"
"@webiny/handler-aws/*", "@webiny/handler-aws"
"@webiny/plugins/*", "@webiny/plugins"
```

Do the same for `tsconfig.build.json` — note that build references use the `/tsconfig.build.json` suffix format:
```
{ "path": "../aws-sdk/tsconfig.build.json" }
{ "path": "../event-handler-aws/tsconfig.build.json" }
{ "path": "../event-handler-core/tsconfig.build.json" }
{ "path": "../handler-aws/tsconfig.build.json" }
{ "path": "../plugins/tsconfig.build.json" }
```
Remove all of these plus matching path mappings.

- [ ] **Step 5: Verify build**

Run: `yarn build -p @webiny/api-sync-to-opensearch 2>&1 | tail -10`
Expected: Build succeeds with no AWS-related imports.

- [ ] **Step 6: Simplify base vitest.config.ts**

Base package only has `Operations.test.ts` now (pure unit test, no OpenSearch needed). Simplify `packages/api-sync-to-opensearch/vitest.config.ts`:

```ts
import { createTestConfig } from "../../testing";

export default async () => {
    return createTestConfig({ path: import.meta.dirname });
};
```

Also update `packages/api-sync-to-opensearch/ci.config.json` — base tests don't need storage ops:

```json
{
    "$schema": "../../.github/workflows/ci.config.schema.json"
}
```

- [ ] **Step 7: Run remaining base tests**

Run: `yarn test packages/api-sync-to-opensearch --testPathPattern="Operations.test" 2>&1 | tail -20`
Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add packages/api-sync-to-opensearch/
git commit -m "refactor(api-sync-to-opensearch): remove AWS deps, clean up old files, update barrel export"
```

---

### Task 8: Create DDB Adapter Package — Scaffold + Marshall

**Files:**
- Create: `packages/api-sync-ddb-to-opensearch/package.json`
- Create: `packages/api-sync-ddb-to-opensearch/tsconfig.json`
- Create: `packages/api-sync-ddb-to-opensearch/tsconfig.build.json`
- Create: `packages/api-sync-ddb-to-opensearch/webiny.config.js`
- Create: `packages/api-sync-ddb-to-opensearch/vitest.config.ts`
- Create: `packages/api-sync-ddb-to-opensearch/ci.config.json`
- Move: `packages/api-sync-to-opensearch/src/marshall.ts` -> `packages/api-sync-ddb-to-opensearch/src/marshall.ts`
- Create: `packages/api-sync-ddb-to-opensearch/src/index.ts` (initial barrel)

**Interfaces:**
- Consumes: `@webiny/aws-sdk` for marshall/unmarshall
- Produces: New package scaffold, `marshall()`, `unmarshall()` functions

- [ ] **Step 1: Create package.json**

Create `packages/api-sync-ddb-to-opensearch/package.json`:

```json
{
    "name": "@webiny/api-sync-ddb-to-opensearch",
    "version": "0.0.0",
    "type": "module",
    "exports": {
        ".": "./index.js",
        "./*": "./*"
    },
    "repository": {
        "type": "git",
        "url": "https://github.com/webiny/webiny-js.git",
        "directory": "packages/api-sync-ddb-to-opensearch"
    },
    "description": "DynamoDB to OpenSearch synchronization adapter.",
    "license": "MIT",
    "author": "Webiny Ltd.",
    "dependencies": {
        "@webiny/api-sync-to-opensearch": "0.0.0",
        "@webiny/api-opensearch": "0.0.0",
        "@webiny/aws-sdk": "0.0.0",
        "@webiny/event-handler-aws": "0.0.0",
        "@webiny/event-handler-core": "0.0.0",
        "@webiny/feature": "0.0.0",
        "@webiny/handler-aws": "0.0.0",
        "@webiny/utils": "0.0.0"
    },
    "devDependencies": {
        "@webiny/build-tools": "0.0.0",
        "typescript": "^7.0.2"
    },
    "publishConfig": {
        "access": "public"
    },
    "adio": {
        "ignoreDirs": [
            "__tests__"
        ]
    },
    "webiny": {
        "publishFrom": "dist"
    }
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `packages/api-sync-ddb-to-opensearch/tsconfig.json`:

```json
{
    "extends": "../../tsconfig.json",
    "include": ["src", "__tests__"],
    "references": [
        { "path": "../api" },
        { "path": "../api-opensearch" },
        { "path": "../api-sync-to-opensearch" },
        { "path": "../aws-sdk" },
        { "path": "../error" },
        { "path": "../event-handler-aws" },
        { "path": "../event-handler-core" },
        { "path": "../feature" },
        { "path": "../handler-aws" },
        { "path": "../utils" }
    ],
    "compilerOptions": {
        "rootDirs": ["./src", "./__tests__"],
        "outDir": "./dist",
        "declarationDir": "./dist",
        "paths": {
            "~/*": ["./src/*"],
            "~tests/*": ["./__tests__/*"],
            "@webiny/api/*": ["../api/src/*"],
            "@webiny/api": ["../api/src"],
            "@webiny/api-opensearch/*": ["../api-opensearch/src/*"],
            "@webiny/api-opensearch": ["../api-opensearch/src"],
            "@webiny/api-sync-to-opensearch/*": ["../api-sync-to-opensearch/src/*"],
            "@webiny/api-sync-to-opensearch": ["../api-sync-to-opensearch/src"],
            "@webiny/aws-sdk/*": ["../aws-sdk/src/*"],
            "@webiny/aws-sdk": ["../aws-sdk/src"],
            "@webiny/error/*": ["../error/src/*"],
            "@webiny/error": ["../error/src"],
            "@webiny/event-handler-aws/*": ["../event-handler-aws/src/*"],
            "@webiny/event-handler-aws": ["../event-handler-aws/src"],
            "@webiny/event-handler-core/*": ["../event-handler-core/src/*"],
            "@webiny/event-handler-core": ["../event-handler-core/src"],
            "@webiny/feature/*": ["../feature/src/*"],
            "@webiny/feature": ["../feature/src"],
            "@webiny/handler-aws/*": ["../handler-aws/src/*"],
            "@webiny/handler-aws": ["../handler-aws/src"],
            "@webiny/utils/*": ["../utils/src/*"],
            "@webiny/utils": ["../utils/src"]
        }
    }
}
```

- [ ] **Step 3: Create tsconfig.build.json**

Create `packages/api-sync-ddb-to-opensearch/tsconfig.build.json`:

```json
{
    "extends": "../../tsconfig.build.json",
    "include": ["src"],
    "references": [
        { "path": "../api" },
        { "path": "../api-opensearch" },
        { "path": "../api-sync-to-opensearch" },
        { "path": "../aws-sdk" },
        { "path": "../error" },
        { "path": "../event-handler-aws" },
        { "path": "../event-handler-core" },
        { "path": "../feature" },
        { "path": "../handler-aws" },
        { "path": "../utils" }
    ],
    "compilerOptions": {
        "rootDir": "./src",
        "outDir": "./dist",
        "declarationDir": "./dist",
        "paths": {
            "~/*": ["./src/*"],
            "@webiny/api/*": ["../api/src/*"],
            "@webiny/api": ["../api/src"],
            "@webiny/api-opensearch/*": ["../api-opensearch/src/*"],
            "@webiny/api-opensearch": ["../api-opensearch/src"],
            "@webiny/api-sync-to-opensearch/*": ["../api-sync-to-opensearch/src/*"],
            "@webiny/api-sync-to-opensearch": ["../api-sync-to-opensearch/src"],
            "@webiny/aws-sdk/*": ["../aws-sdk/src/*"],
            "@webiny/aws-sdk": ["../aws-sdk/src"],
            "@webiny/error/*": ["../error/src/*"],
            "@webiny/error": ["../error/src"],
            "@webiny/event-handler-aws/*": ["../event-handler-aws/src/*"],
            "@webiny/event-handler-aws": ["../event-handler-aws/src"],
            "@webiny/event-handler-core/*": ["../event-handler-core/src/*"],
            "@webiny/event-handler-core": ["../event-handler-core/src"],
            "@webiny/feature/*": ["../feature/src/*"],
            "@webiny/feature": ["../feature/src"],
            "@webiny/handler-aws/*": ["../handler-aws/src/*"],
            "@webiny/handler-aws": ["../handler-aws/src"],
            "@webiny/utils/*": ["../utils/src/*"],
            "@webiny/utils": ["../utils/src"]
        }
    }
}
```

- [ ] **Step 4: Create webiny.config.js**

Create `packages/api-sync-ddb-to-opensearch/webiny.config.js`:

```js
import { createWatchPackage, createBuildPackage } from "@webiny/build-tools";

export default {
    commands: {
        build: createBuildPackage({ cwd: import.meta.dirname }),
        watch: createWatchPackage({ cwd: import.meta.dirname })
    }
};
```

- [ ] **Step 5: Create vitest.config.ts**

Create `packages/api-sync-ddb-to-opensearch/vitest.config.ts`:

```ts
import { createTestConfig } from "../../testing";
import { getOpenSearchIndexPrefix } from "@webiny/api-opensearch";

export default async () => {
    const prefix = getOpenSearchIndexPrefix();
    process.env.OPENSEARCH_INDEX_PREFIX = `${prefix}api-sync-ddb-to-opensearch-`;
    return createTestConfig({ path: import.meta.dirname });
};
```

- [ ] **Step 6: Create ci.config.json**

Create `packages/api-sync-ddb-to-opensearch/ci.config.json`:

```json
{
    "$schema": "../../.github/workflows/ci.config.schema.json",
    "vitest": {
        "storageOps": ["ddb-os,ddb"]
    }
}
```

- [ ] **Step 7: Create marshall.ts**

Create `packages/api-sync-ddb-to-opensearch/src/marshall.ts` with the same content as the current `packages/api-sync-to-opensearch/src/marshall.ts`:

```ts
import {
    marshall as baseMarshall,
    unmarshall as baseUnmarshall
} from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

import type { AttributeValue } from "@webiny/aws-sdk/types/index.js";

export interface MarshalledValue {
    [key: string]: AttributeValue;
}

export const marshall = (value: GenericRecord): MarshalledValue => {
    if (!value) {
        return value;
    }
    return baseMarshall(value) as MarshalledValue;
};

export const unmarshall = <T>(value?: MarshalledValue): T | undefined => {
    if (!value) {
        return undefined;
    }
    // @ts-expect-error
    return baseUnmarshall(value) as T;
};
```

- [ ] **Step 8: Create initial barrel export**

Create `packages/api-sync-ddb-to-opensearch/src/index.ts`:

```ts
export { marshall, unmarshall } from "./marshall.js";
```

- [ ] **Step 9: Install deps and verify build**

Run:
```bash
yarn > /dev/null 2>&1
yarn build -p @webiny/api-sync-ddb-to-opensearch 2>&1 | tail -10
```
Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
git add packages/api-sync-ddb-to-opensearch/
git commit -m "feat(api-sync-ddb-to-opensearch): scaffold new DDB adapter package with marshall"
```

---

### Task 9: DDB Adapter — DdbOperationsBuilder Implementation + Feature

**Files:**
- Create: `packages/api-sync-ddb-to-opensearch/src/features/DdbOperationsBuilder/implementation.ts`
- Create: `packages/api-sync-ddb-to-opensearch/src/features/DdbOperationsBuilder/feature.ts`
- Move: `packages/api-sync-to-opensearch/__tests__/OperationsBuilder.test.ts` -> `packages/api-sync-ddb-to-opensearch/__tests__/OperationsBuilder.test.ts`

**Interfaces:**
- Consumes: `OperationsBuilder` abstraction from Task 3; `OperationsImpl` and `OperationType` from Task 2; `CompressionHandler` from `@webiny/utils`; `unmarshall` from Task 8
- Produces: `DdbOperationsBuilderImplementation` DI registration, `DdbOperationsBuilderFeature`

- [ ] **Step 1: Create DdbOperationsBuilder implementation**

Create `packages/api-sync-ddb-to-opensearch/src/features/DdbOperationsBuilder/implementation.ts`:

Move logic from existing `packages/api-sync-to-opensearch/src/OperationsBuilder.ts`. Uses `OperationsBuilder` abstraction from base, resolves `CompressionHandler` from container.

```ts
import type { DynamoDBRecord } from "@webiny/aws-sdk/types/index.js";
import { OperationsBuilder, type IOperationsBuilder } from "@webiny/api-sync-to-opensearch/features/OperationsBuilder/abstraction.js";
import { OperationsImpl, OperationType } from "@webiny/api-sync-to-opensearch/features/Operations/implementation.js";
import type { Operations } from "@webiny/api-sync-to-opensearch/features/Operations/abstraction.js";
import { unmarshall } from "~/marshall.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";

interface RecordDynamoDbImage {
    data: {
        compression: string;
        value: string;
    };
    ignore?: boolean;
    index: string;
}

interface RecordDynamoDbKeys {
    PK: string;
    SK: string;
}

class DdbOperationsBuilderImpl implements IOperationsBuilder<DynamoDBRecord> {
    public constructor(private readonly compressor: CompressionHandler.Interface) {}

    public async build(params: {
        records: DynamoDBRecord[];
    }): Promise<Operations.Interface> {
        const operations = new OperationsImpl();
        for (const record of params.records) {
            if (!record.dynamodb) {
                continue;
            } else if (!record.eventName) {
                console.error(
                    `Could not get operation from the record, skipping event "${record.eventID}".`
                );
                continue;
            }

            const keys = unmarshall<RecordDynamoDbKeys>(record.dynamodb.Keys);
            if (!keys?.PK || !keys.SK) {
                console.error(
                    `Could not get keys from the record, skipping event "${record.eventID}".`
                );
                continue;
            }

            const id = `${keys.PK}:${keys.SK}`;

            if (
                record.eventName === OperationType.INSERT ||
                record.eventName === OperationType.MODIFY
            ) {
                const newImage = unmarshall<RecordDynamoDbImage>(record.dynamodb.NewImage);
                if (
                    !newImage ||
                    typeof newImage !== "object" ||
                    Object.keys(newImage).length === 0
                ) {
                    continue;
                } else if (newImage.ignore === true) {
                    continue;
                } else if (!newImage.index) {
                    console.error(
                        `Could not get index from the new image, skipping event "${record.eventID}".`
                    );
                    console.log({ newImage });
                    continue;
                }
                const data = await this.compressor.decompress(newImage.data);
                if (data === undefined || data === null) {
                    console.error(
                        `Could not get decompressed data, skipping ES operation "${record.eventName}", ID ${id}. Skipping...`
                    );
                    continue;
                }

                operations.insert({
                    id,
                    index: newImage.index,
                    data
                });
            } else if (record.eventName === OperationType.REMOVE) {
                const oldImage = unmarshall<RecordDynamoDbImage>(record.dynamodb.OldImage);
                if (!oldImage?.index) {
                    continue;
                }
                operations.delete({
                    id,
                    index: oldImage.index
                });
            }
        }
        return operations;
    }
}

export const DdbOperationsBuilderImplementation = OperationsBuilder.createImplementation({
    implementation: DdbOperationsBuilderImpl,
    dependencies: [CompressionHandler]
});
```

- [ ] **Step 2: Create DdbOperationsBuilderFeature**

Create `packages/api-sync-ddb-to-opensearch/src/features/DdbOperationsBuilder/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { DdbOperationsBuilderImplementation } from "./implementation.js";

export const DdbOperationsBuilderFeature = createFeature({
    name: "sync.ddb.operationsBuilder",
    register(container) {
        container.register(DdbOperationsBuilderImplementation);
    }
});
```

- [ ] **Step 3: Move and rewrite OperationsBuilder test**

```bash
mkdir -p packages/api-sync-ddb-to-opensearch/__tests__
```

Create `packages/api-sync-ddb-to-opensearch/__tests__/OperationsBuilder.test.ts` with updated imports. The current test uses `new OperationsBuilder({ compressor })` directly and resolves `CompressionHandler` from a mock context container. After refactor, the test resolves `DdbOperationsBuilderImpl` from a properly wired container:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/feature/api";
import type { DynamoDBRecord } from "@webiny/aws-sdk/types/index.js";
import { marshall } from "~/marshall";
import { OperationType } from "@webiny/api-sync-to-opensearch/features/Operations/implementation.js";
import { OperationsBuilder } from "@webiny/api-sync-to-opensearch/features/OperationsBuilder/abstraction.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { DdbOperationsBuilderFeature } from "~/features/DdbOperationsBuilder/feature";

describe("OperationsBuilder", () => {
    let builder: OperationsBuilder.Interface;

    beforeEach(() => {
        const container = new Container();
        CompressionFeature.register(container);
        DdbOperationsBuilderFeature.register(container);
        builder = container.resolve(OperationsBuilder);
    });

    it("should build an insert operation", async () => {
        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.INSERT,
                dynamodb: {
                    Keys: marshall({
                        PK: "insertPk",
                        SK: "insertSk"
                    }),
                    NewImage: marshall({
                        index: "a-test-index",
                        data: {
                            id: "123",
                            title: "Test"
                        }
                    })
                }
            }
        ];

        const operations = await builder.build({ records });
        expect(operations.total).toBe(2);
        expect(operations.items).toEqual([
            {
                index: {
                    _id: "insertPk:insertSk",
                    _index: "a-test-index"
                }
            },
            {
                id: "123",
                title: "Test"
            }
        ]);
    });

    it("should build a delete operation", async () => {
        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.REMOVE,
                dynamodb: {
                    Keys: marshall({
                        PK: "deletePk",
                        SK: "deleteSk"
                    }),
                    OldImage: marshall({
                        index: "a-test-index-for-delete"
                    })
                }
            }
        ];

        const operations = await builder.build({ records });
        expect(operations.total).toBe(1);
        expect(operations.items).toEqual([
            {
                delete: {
                    _id: "deletePk:deleteSk",
                    _index: "a-test-index-for-delete"
                }
            }
        ]);
    });

    it("should skip record if there are no keys", async () => {
        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.INSERT,
                dynamodb: {
                    NewImage: marshall({
                        index: "a-test-index",
                        data: { id: "123", title: "Test" }
                    })
                }
            }
        ];

        const operations = await builder.build({ records });
        expect(operations.total).toBe(0);
        expect(operations.items).toEqual([]);
    });

    it("should skip record if there is a missing dynamodb property", async () => {
        const records: DynamoDBRecord[] = [
            { eventID: "123", eventName: OperationType.INSERT }
        ];

        const operations = await builder.build({ records });
        expect(operations.total).toBe(0);
        expect(operations.items).toEqual([]);
    });

    it("should skip record if newImage is marked as ignored", async () => {
        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.INSERT,
                dynamodb: {
                    Keys: marshall({ PK: "insertPk", SK: "insertSk" }),
                    NewImage: marshall({ ignore: true })
                }
            }
        ];

        const operations = await builder.build({ records });
        expect(operations.total).toBe(0);
        expect(operations.items).toEqual([]);
    });

    it("should skip record if there is nothing in the newImage", async () => {
        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.INSERT,
                dynamodb: {
                    Keys: marshall({ PK: "insertPk", SK: "insertSk" }),
                    NewImage: marshall({})
                }
            },
            {
                eventID: "123",
                eventName: OperationType.INSERT,
                dynamodb: {
                    Keys: marshall({ PK: "insertPk", SK: "insertSk" }),
                    // @ts-expect-error
                    NewImage: null
                }
            }
        ];

        const operations = await builder.build({ records });
        expect(operations.total).toBe(0);
        expect(operations.items).toEqual([]);
    });

    it("should skip record if there is no data in the newImage.data", async () => {
        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.INSERT,
                dynamodb: {
                    Keys: marshall({ PK: "insertPk", SK: "insertSk" }),
                    NewImage: marshall({ index: "a-test-index" })
                }
            }
        ];

        const operations = await builder.build({ records });
        expect(operations.total).toBe(0);
        expect(operations.items).toEqual([]);
    });

    it("should skip record if there is no index in the oldImage", async () => {
        const records: DynamoDBRecord[] = [
            {
                eventID: "123",
                eventName: OperationType.REMOVE,
                dynamodb: {
                    Keys: marshall({ PK: "deletePk", SK: "deleteSk" }),
                    OldImage: marshall({})
                }
            },
            {
                eventID: "1234",
                eventName: OperationType.REMOVE,
                dynamodb: {
                    Keys: marshall({ PK: "deletePk", SK: "deleteSk" }),
                    // @ts-expect-error
                    OldImage: null
                }
            },
            {
                eventID: "12345",
                eventName: OperationType.REMOVE,
                dynamodb: {
                    Keys: marshall({ PK: "deletePk", SK: "deleteSk" })
                }
            }
        ];

        const operations = await builder.build({ records });
        expect(operations.total).toBe(0);
        expect(operations.items).toEqual([]);
    });
});
```

- [ ] **Step 4: Run test**

Run: `yarn test packages/api-sync-ddb-to-opensearch --testPathPattern="OperationsBuilder.test" 2>&1 | tail -20`
Expected: Tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/api-sync-ddb-to-opensearch/src/features/DdbOperationsBuilder/ packages/api-sync-ddb-to-opensearch/__tests__/OperationsBuilder.test.ts
git commit -m "feat(api-sync-ddb-to-opensearch): add DdbOperationsBuilder implementation and feature"
```

---

### Task 10: DDB Adapter — DdbToOpenSearchHandler + Composite Feature

**Files:**
- Create: `packages/api-sync-ddb-to-opensearch/src/features/DdbToOpenSearchHandler/implementation.ts`
- Create: `packages/api-sync-ddb-to-opensearch/src/features/DdbToOpenSearchHandler/feature.ts`
- Create: `packages/api-sync-ddb-to-opensearch/src/features/DdbToOpenSearchFeature.ts`
- Create: `packages/api-sync-ddb-to-opensearch/src/createDdbToOpenSearchStreamHandler.ts`
- Move: test files from base to adapter

**Interfaces:**
- Consumes: `DynamoDBEventHandler` from `@webiny/event-handler-aws`; `OperationsBuilder` from Task 3; `ExecuteSyncWithRetry` from Task 5; `OpenSearchClient` from `@webiny/api-opensearch`; `Timer` from Task 1; all base features from Tasks 4-6; `DdbOperationsBuilderFeature` from Task 9
- Produces: `DdbToOpenSearchHandler`, `DdbToOpenSearchFeature` (composite), `createDdbToOpenSearchStreamHandler` factory

- [ ] **Step 1: Create DdbToOpenSearchHandler implementation**

Create `packages/api-sync-ddb-to-opensearch/src/features/DdbToOpenSearchHandler/implementation.ts`:

```ts
import type { Container } from "@webiny/feature/api";
import type { DynamoDBStreamEvent } from "@webiny/aws-sdk/types/index.js";
import {
    DynamoDBEventHandler,
    type DynamoDBResult
} from "@webiny/event-handler-aws/abstractions/handlers/DynamoDBEventHandler.js";
import { RequestContainer } from "@webiny/event-handler-core";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { Timer } from "@webiny/utils/features/Timer/abstraction.js";
import { OperationsBuilder } from "@webiny/api-sync-to-opensearch/features/OperationsBuilder/abstraction.js";
import { ExecuteSyncWithRetry } from "@webiny/api-sync-to-opensearch/features/ExecuteSyncWithRetry/abstraction.js";

const MAX_RUNNING_TIME = 900;

class DdbToOpenSearchHandlerImpl implements DynamoDBEventHandler.Interface {
    constructor(private container: Container) {}

    async execute(
        eventCtx: EventContext<DynamoDBStreamEvent>,
        _next: NextFunction
    ): Promise<DynamoDBResult> {
        let client: OpenSearchClient.Interface;
        try {
            client = this.container.resolve(OpenSearchClient);
        } catch {
            console.error("Missing OpenSearchClient in container.");
            return { success: false, message: "Missing opensearch client." };
        }

        const builder = this.container.resolve(OperationsBuilder);
        const operations = await builder.build({ records: eventCtx.event.Records });

        if (operations.total === 0) {
            return { success: true, processedRecords: 0 };
        }

        const timer = this.container.resolve(Timer);
        const executeSyncWithRetry = this.container.resolve(ExecuteSyncWithRetry);

        await executeSyncWithRetry.execute({
            timer,
            maxRunningTime: MAX_RUNNING_TIME,
            openSearchClient: client.use(),
            operations
        });

        return { success: true, processedRecords: operations.count };
    }
}

export const DdbToOpenSearchHandler = DynamoDBEventHandler.createImplementation({
    implementation: DdbToOpenSearchHandlerImpl,
    dependencies: [RequestContainer]
});
```

- [ ] **Step 2: Create DdbToOpenSearchHandler feature**

Create `packages/api-sync-ddb-to-opensearch/src/features/DdbToOpenSearchHandler/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { DdbToOpenSearchHandler } from "./implementation.js";

export const DdbToOpenSearchHandlerFeature = createFeature({
    name: "sync.ddb.handler",
    register(container) {
        container.register(DdbToOpenSearchHandler);
    }
});
```

- [ ] **Step 3: Create DdbToOpenSearchFeature (composite)**

Create `packages/api-sync-ddb-to-opensearch/src/features/DdbToOpenSearchFeature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import type { Client } from "@webiny/api-opensearch/client.js";
import { ExecuteSyncFeature } from "@webiny/api-sync-to-opensearch/features/ExecuteSync/feature.js";
import { ExecuteSyncWithRetryFeature } from "@webiny/api-sync-to-opensearch/features/ExecuteSyncWithRetry/feature.js";
import { SynchronizationBuilderFeature } from "@webiny/api-sync-to-opensearch/features/SynchronizationBuilder/feature.js";
import { DdbOperationsBuilderFeature } from "./DdbOperationsBuilder/feature.js";
import { DdbToOpenSearchHandlerFeature } from "./DdbToOpenSearchHandler/feature.js";
import { OpenSearchClientFeature } from "@webiny/api-opensearch/features/OpenSearchClient/feature.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";

export interface DdbToOpenSearchFeatureConfig {
    client: Client;
}

export const DdbToOpenSearchFeature = createFeature<DdbToOpenSearchFeatureConfig>({
    name: "sync.ddb-to-opensearch",
    register(container, config) {
        OpenSearchClientFeature.register(container, config.client);
        CompressionFeature.register(container);

        ExecuteSyncFeature.register(container);
        ExecuteSyncWithRetryFeature.register(container);
        SynchronizationBuilderFeature.register(container);

        DdbOperationsBuilderFeature.register(container);
        DdbToOpenSearchHandlerFeature.register(container);
    }
});
```

- [ ] **Step 4: Create stream handler factory**

Create `packages/api-sync-ddb-to-opensearch/src/createDdbToOpenSearchStreamHandler.ts`:

```ts
import { Container } from "@webiny/feature/api";
import { RequestContainer } from "@webiny/event-handler-core";
import { DynamoDBEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/DynamoDBEventHandler.js";
import { TimerFeature } from "@webiny/utils/features/Timer/feature.js";
import { DdbToOpenSearchFeature } from "./features/DdbToOpenSearchFeature.js";
import type { Client } from "@webiny/api-opensearch/client.js";
import type { DynamoDBStreamEvent } from "@webiny/aws-sdk/types/index.js";

export type DdbToOpenSearchStreamHandler = (event: DynamoDBStreamEvent) => Promise<void>;

export const createDdbToOpenSearchStreamHandler = (
    client: Client
): DdbToOpenSearchStreamHandler => {
    const container = new Container();
    container.registerInstance(RequestContainer, container);

    // Existing behavior: MAX_RUNNING_TIME = 900 hardcoded.
    // In real Lambda deployments, the handler bootstrap should register a Timer
    // that wraps context.getRemainingTimeInMillis(). This factory matches current behavior.
    TimerFeature.register(container, { getRemainingSeconds: () => 900 });

    DdbToOpenSearchFeature.register(container, { client });

    const handler = container.resolve(DynamoDBEventHandler);

    return async (event: DynamoDBStreamEvent): Promise<void> => {
        await handler.execute({ event, metadata: {} }, () => Promise.resolve());
    };
};
```

- [ ] **Step 5: Update barrel export**

Replace `packages/api-sync-ddb-to-opensearch/src/index.ts`:

```ts
export { marshall, unmarshall } from "./marshall.js";
export { DdbToOpenSearchFeature, type DdbToOpenSearchFeatureConfig } from "./features/DdbToOpenSearchFeature.js";
export { createDdbToOpenSearchStreamHandler, type DdbToOpenSearchStreamHandler } from "./createDdbToOpenSearchStreamHandler.js";
export { DdbToOpenSearchHandler } from "./features/DdbToOpenSearchHandler/implementation.js";
```

- [ ] **Step 6: Move remaining test files from base to adapter**

```bash
cp packages/api-sync-to-opensearch/__tests__/event.test.ts packages/api-sync-ddb-to-opensearch/__tests__/event.test.ts
cp packages/api-sync-to-opensearch/__tests__/transfer.test.ts packages/api-sync-ddb-to-opensearch/__tests__/transfer.test.ts
```

Both tests import `DdbToEsLambdaHandler` and manually wire a container. Update imports in copied tests:

In `event.test.ts`:
```ts
// Before
import { DdbToEsLambdaHandler } from "~/DdbToEsLambdaHandler";

// After
import { DdbToOpenSearchHandler } from "~/features/DdbToOpenSearchHandler/implementation";
```

Also update `container.register(DdbToEsLambdaHandler)` to `container.register(DdbToOpenSearchHandler)`.

Both tests also need `Timer` and `ExecuteSync`/`ExecuteSyncWithRetry` registered in the container since the handler now resolves these from DI. Add feature registration in `createHandler`:

```ts
import { TimerFeature } from "@webiny/utils/features/Timer/feature.js";
import { ExecuteSyncFeature } from "@webiny/api-sync-to-opensearch/features/ExecuteSync/feature.js";
import { ExecuteSyncWithRetryFeature } from "@webiny/api-sync-to-opensearch/features/ExecuteSyncWithRetry/feature.js";
import { DdbOperationsBuilderFeature } from "~/features/DdbOperationsBuilder/feature";

// Inside container setup:
TimerFeature.register(container, { getRemainingSeconds: () => 900 });
ExecuteSyncFeature.register(container);
ExecuteSyncWithRetryFeature.register(container);
DdbOperationsBuilderFeature.register(container);
```

In `transfer.test.ts`, same import changes plus:
```ts
// Before
import { OperationType } from "~/index";

// After
import { OperationType } from "@webiny/api-sync-to-opensearch/features/Operations/implementation.js";
```

No `mocks/context.ts` needed — current tests don't use mock context (only OperationsBuilder.test.ts used it, which was already rewritten in Task 9).

- [ ] **Step 7: Delete moved test files from base**

```bash
rm packages/api-sync-to-opensearch/__tests__/event.test.ts
rm packages/api-sync-to-opensearch/__tests__/transfer.test.ts
rm packages/api-sync-to-opensearch/__tests__/OperationsBuilder.test.ts
rm -rf packages/api-sync-to-opensearch/__tests__/mocks/
```

- [ ] **Step 8: Verify build**

Run:
```bash
yarn > /dev/null 2>&1
yarn build -p @webiny/api-sync-ddb-to-opensearch 2>&1 | tail -10
```
Expected: Build succeeds.

- [ ] **Step 9: Run adapter tests**

Run: `yarn test packages/api-sync-ddb-to-opensearch 2>&1 | tail -30`
Expected: All tests pass (OperationsBuilder, event, transfer).

- [ ] **Step 10: Commit**

```bash
git add packages/api-sync-ddb-to-opensearch/ packages/api-sync-to-opensearch/__tests__/
git commit -m "feat(api-sync-ddb-to-opensearch): add handler, composite feature, stream handler factory, and tests"
```

---

### Task 11: Update Consumers

**Files:**
- Modify: `packages/api-elasticsearch-tasks/package.json`
- Modify: `packages/api-elasticsearch-tasks/tsconfig.json`
- Modify: `packages/api-elasticsearch-tasks/tsconfig.build.json`
- Modify: `packages/api-elasticsearch-tasks/src/tasks/dataSynchronization/elasticsearch/ElasticsearchSynchronize.ts`
- Modify: `packages/api-elasticsearch-tasks/__tests__/tasks/dataSynchronization/ElasticsearchToDynamoDbSynchronization.test.ts`
- Modify: `packages/api-headless-cms-ddb-es/package.json`
- Modify: `packages/api-headless-cms-ddb-es/tsconfig.json`
- Modify: `packages/api-headless-cms-ddb-es/tsconfig.build.json`
- Modify: `packages/api-headless-cms-ddb-es/__tests__/__api__/setupFile.js`
- Modify: `packages/project-aws-template/package.json`
- Modify: `packages/project-aws/_templates/extensions/OpenSearch/coreDdbToEsHandler/dynamoToElastic/src/index.ts`
- Modify: `packages/cli-core/files/references.json`

**Interfaces:**
- Consumes: `createDdbToOpenSearchStreamHandler` from `@webiny/api-sync-ddb-to-opensearch`; `SynchronizationBuilder` from `@webiny/api-sync-to-opensearch`

- [ ] **Step 1: Update `api-headless-cms-ddb-es` — setupFile.js**

In `packages/api-headless-cms-ddb-es/__tests__/__api__/setupFile.js`, change:

```js
// Before
import { createDdbToEsStreamHandler } from "@webiny/api-sync-to-opensearch";

// After
import { createDdbToOpenSearchStreamHandler } from "@webiny/api-sync-ddb-to-opensearch";
```

And update the usage:
```js
// Before
simulateStream(documentClient, createDdbToEsStreamHandler(opensearchClient));

// After
simulateStream(documentClient, createDdbToOpenSearchStreamHandler(opensearchClient));
```

- [ ] **Step 2: Update `api-headless-cms-ddb-es` — package.json**

Change dependency:
```json
// Before
"@webiny/api-sync-to-opensearch": "0.0.0"

// After
"@webiny/api-sync-ddb-to-opensearch": "0.0.0"
```

- [ ] **Step 3: Update `api-headless-cms-ddb-es` — tsconfig.json and tsconfig.build.json**

In both files, change the reference:
```json
// Before
{ "path": "../api-sync-to-opensearch" }

// After
{ "path": "../api-sync-ddb-to-opensearch" }
```

And update path mappings:
```json
// Before
"@webiny/api-sync-to-opensearch/*": ["../api-sync-to-opensearch/src/*"],
"@webiny/api-sync-to-opensearch": ["../api-sync-to-opensearch/src"]

// After
"@webiny/api-sync-ddb-to-opensearch/*": ["../api-sync-ddb-to-opensearch/src/*"],
"@webiny/api-sync-ddb-to-opensearch": ["../api-sync-ddb-to-opensearch/src"]
```

- [ ] **Step 4: Update `api-elasticsearch-tasks` — ElasticsearchSynchronize.ts**

In `packages/api-elasticsearch-tasks/src/tasks/dataSynchronization/elasticsearch/ElasticsearchSynchronize.ts`:

The class `ElasticsearchSynchronizeImpl` currently has constructor deps `(controller, dbRegistry, openSearchClient)` resolved via DI. It calls `createSynchronizationBuilder()` as a factory. After refactor, add `SynchronizationBuilder` as a fourth constructor dependency:

```ts
// Before
import { createSynchronizationBuilder } from "@webiny/api-sync-to-opensearch";

// After
import { SynchronizationBuilder } from "@webiny/api-sync-to-opensearch/features/SynchronizationBuilder/abstraction.js";
```

Update constructor to receive it:
```ts
class ElasticsearchSynchronizeImpl implements Abstraction.Interface {
    public constructor(
        private readonly controller: TaskController.Interface,
        private readonly dbRegistry: DbRegistry.Interface,
        private readonly openSearchClient: OpenSearchClient.Interface,
        private readonly syncBuilder: SynchronizationBuilder.Interface
    ) {}
```

Update `execute()` method:
```ts
// Before (line 73)
const elasticsearchSyncBuilder = createSynchronizationBuilder({
    openSearchClient: this.openSearchClient.use(),
    timer: this.controller.runtime
});

// After
const elasticsearchSyncBuilder = this.syncBuilder;
```

Update the `createImplementation` call at the bottom of the file:
```ts
// Before
export const ElasticsearchSynchronize = Abstraction.createImplementation({
    implementation: ElasticsearchSynchronizeImpl,
    dependencies: [TaskController, DbRegistry, OpenSearchClient]
});

// After
export const ElasticsearchSynchronize = Abstraction.createImplementation({
    implementation: ElasticsearchSynchronizeImpl,
    dependencies: [TaskController, DbRegistry, OpenSearchClient, SynchronizationBuilder]
});
```

This requires that the container where `ElasticsearchSynchronize` is registered also has `SynchronizationBuilder`, `Timer`, `ExecuteSync`, and `ExecuteSyncWithRetry` registered. The host application's DI setup must register these base features (or the adapter's composite feature).

- [ ] **Step 5: Update `api-elasticsearch-tasks` — package.json and tsconfig**

In `package.json`, the dependency `"@webiny/api-sync-to-opensearch": "0.0.0"` stays (it imports the base abstraction). Verify tsconfig references include `api-sync-to-opensearch`.

- [ ] **Step 6: Update `project-aws-template` — package.json**

Change dependency:
```json
// Before
"@webiny/api-sync-to-opensearch": "0.0.0"

// After
"@webiny/api-sync-ddb-to-opensearch": "0.0.0"
```

- [ ] **Step 7: Update project-aws template**

In `packages/project-aws/_templates/extensions/OpenSearch/coreDdbToEsHandler/dynamoToElastic/src/index.ts`:

```ts
// Before
import { createDdbToEsStreamHandler } from "@webiny/api-sync-to-opensearch";

// After
import { createDdbToOpenSearchStreamHandler } from "@webiny/api-sync-ddb-to-opensearch";
```

Update usage:
```ts
// Before
export const handler = createDdbToEsStreamHandler(client);

// After
export const handler = createDdbToOpenSearchStreamHandler(client);
```

- [ ] **Step 8: Update references.json**

`packages/cli-core/files/references.json` currently lists `api-sync-to-opensearch/package.json` under `p-retry` (dependencies) and `typescript` (devDependencies). After the split:

- `p-retry` stays with base package (`api-sync-to-opensearch/package.json`) — no change needed
- `typescript` devDep entry stays with base — no change needed
- Add `api-sync-ddb-to-opensearch/package.json` to `typescript` devDependencies entry

Note: `references.json` is auto-generated by `yarn webiny sync-dependencies` (run in Task 12). Manual edits may be overwritten — verify after running sync.

- [ ] **Step 9: Verify builds**

Run:
```bash
yarn > /dev/null 2>&1
yarn build -p @webiny/api-elasticsearch-tasks 2>&1 | tail -10
yarn build -p @webiny/api-headless-cms-ddb-es 2>&1 | tail -10
```
Expected: Both build successfully.

- [ ] **Step 10: Commit**

```bash
git add packages/api-elasticsearch-tasks/ packages/api-headless-cms-ddb-es/ packages/project-aws-template/ packages/project-aws/ packages/cli-core/
git commit -m "refactor: update consumers to use api-sync-ddb-to-opensearch"
```

---

### Task 12: Run Pre-Commit Checks + Final Verification

**Files:**
- Potentially all modified files (formatting, lint, tsconfig generation)

- [ ] **Step 1: Run all pre-commit scripts**

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

If any step fails, fix and rerun from the beginning.

- [ ] **Step 2: Run base package tests**

Run: `yarn test packages/api-sync-to-opensearch 2>&1 | tail -20`
Expected: Operations test passes. No DDB tests remain.

- [ ] **Step 3: Run adapter package tests**

Run: `yarn test packages/api-sync-ddb-to-opensearch 2>&1 | tail -30`
Expected: All tests pass.

- [ ] **Step 4: Run consumer tests (api-elasticsearch-tasks)**

Run: `yarn test packages/api-elasticsearch-tasks 2>&1 | tail -30`
Expected: Tests pass (or note if they require OpenSearch infra).

- [ ] **Step 5: Verify no AWS imports in base package**

Run:
```bash
grep -r "@webiny/aws-sdk\|@webiny/handler-aws\|@webiny/event-handler-aws" packages/api-sync-to-opensearch/src/ 2>/dev/null
```
Expected: No output (zero AWS imports).

- [ ] **Step 6: Commit final cleanup**

```bash
git add .
git commit -m "chore: final cleanup — formatting, lint, tsconfig, dependency sync"
```
