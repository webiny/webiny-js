# api-sync-to-opensearch Package Split

**Date:** 2026-07-15
**Status:** Draft
**Scope:** Split `@webiny/api-dynamodb-to-elasticsearch` (renamed to `@webiny/api-sync-to-opensearch`) into a platform-agnostic base package and a DynamoDB-specific adapter package.

## Problem

The current package mixes OpenSearch storage concerns (bulk operations, health checks, retries) with DynamoDB-specific concerns (stream event handling, DDB record marshalling, Lambda handler). This coupling prevents reuse for non-DDB data sources (e.g., PostgreSQL) and leaks AWS dependencies into code that only cares about OpenSearch.

## Solution

Two packages:

1. **`@webiny/api-sync-to-opensearch`** (base) — OpenSearch-only. Stores data into OpenSearch indices with retries, health checks, and fail recovery. No AWS imports. All concerns exposed as proper DI abstractions (abstraction/implementation/feature pattern).

2. **`@webiny/api-sync-ddb-to-opensearch`** (adapter) — DynamoDB stream handler. Transforms DDB records into OpenSearch operations. Registers both its own features AND all base package features. Consumers import only this package.

## Architecture Decisions

### DI Pattern

All concerns use the Webiny abstraction/implementation/feature pattern:
- **Abstraction:** `createAbstraction<T>(token)` with namespace for `Interface` type export
- **Implementation:** `Abstraction.createImplementation({ implementation, dependencies })`
- **Feature:** `createFeature({ name, register(container, ...) })` — registers implementation into container

### Timer Abstraction

`ITimer` moves from `@webiny/handler-aws` to `@webiny/utils` as a proper abstraction. Single method: `getRemainingSeconds(): number`. This is the shared Timer for the entire system — sync pipeline, background tasks, and any other consumer.

Note: `@webiny/background-tasks` currently has its own `Timer` namespace (with both `getRemainingSeconds` and `getRemainingMilliseconds`). That should eventually be consolidated to use the `@webiny/utils` Timer abstraction. Full background-tasks migration is out of scope for this PR, but the utils Timer is designed as the canonical one.

Lambda timer implementation stays in `@webiny/handler-aws` (or is provided at handler bootstrap). Server environments register their own.

### Composite Registration

The DDB adapter package acts as the single entry point for consumers. It registers all base features internally (same pattern as `MailerFeature` registering sub-features). Consumers never import the base package directly.

```ts
// Consumer code — single import
import { DdbToOpenSearchFeature } from "@webiny/api-sync-ddb-to-opensearch";
DdbToOpenSearchFeature.register(container, { client });
```

### Decoratability

All abstractions (ExecuteSync, ExecuteSyncWithRetry, SynchronizationBuilder, OperationsBuilder) can be decorated by adapter packages. The DDB adapter registers base implementations, then decorates as needed. Future adapters (PG) follow the same pattern.

## Base Package: `@webiny/api-sync-to-opensearch`

### File Structure

```
packages/api-sync-to-opensearch/
  src/
    features/
      Operations/
        abstraction.ts
        implementation.ts
      OperationsBuilder/
        abstraction.ts
      ExecuteSync/
        abstraction.ts
        implementation.ts
        feature.ts
      ExecuteSyncWithRetry/
        abstraction.ts
        implementation.ts
        feature.ts
      SynchronizationBuilder/
        abstraction.ts
        implementation.ts
        feature.ts
    NotEnoughRemainingTimeError.ts
    helpers/
      getNumberEnvVariable.ts
      shouldShowLogs.ts
    index.ts
```

### Abstractions

#### Operations

Bulk operation accumulator for OpenSearch. Batches insert/modify/delete into bulk-API-compatible items array.

```ts
// features/Operations/abstraction.ts
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

Implementation: current `Operations` class logic (unchanged). Not registered via feature — instantiated directly by `SynchronizationBuilder` and `OperationsBuilder` implementations since each needs its own instance (not a singleton).

#### OperationsBuilder

Generic abstraction for transforming source records into OpenSearch operations. Parameterized by record type.

```ts
// features/OperationsBuilder/abstraction.ts
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

No implementation in base package. Each adapter provides its own (DDB adapter provides `DdbOperationsBuilder`).

#### ExecuteSync

Single bulk execution against OpenSearch with health check.

```ts
// features/ExecuteSync/abstraction.ts
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

Implementation: current `execute.ts` logic wrapped in a class. Registered via `ExecuteSyncFeature`.

#### ExecuteSyncWithRetry

Retry wrapper around ExecuteSync.

```ts
// features/ExecuteSyncWithRetry/abstraction.ts
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

Implementation: current `executeWithRetry.ts` logic. Resolves `ExecuteSync` from container. Registered via `ExecuteSyncWithRetryFeature`.

#### SynchronizationBuilder

Fluent builder for accumulating operations and executing them.

```ts
// features/SynchronizationBuilder/abstraction.ts
import { createAbstraction } from "@webiny/feature/api";
import type { IInsertOperationParams, IDeleteOperationParams, IModifyOperationParams }
    from "../Operations/abstraction.js";
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

Implementation resolves `Timer`, `OpenSearchClient`, and `ExecuteSyncWithRetry` from container. Registered via `SynchronizationBuilderFeature`.

### Dependencies (package.json)

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

No `@webiny/aws-sdk`, no `@webiny/handler-aws`, no `@webiny/event-handler-aws`.

### OperationType Enum

`OperationType` (INSERT/MODIFY/REMOVE) stays in base `Operations/implementation.ts`. Generic enough names. DDB adapter maps stream event names directly.

## DDB Adapter Package: `@webiny/api-sync-ddb-to-opensearch`

### File Structure

```
packages/api-sync-ddb-to-opensearch/
  src/
    features/
      DdbOperationsBuilder/
        implementation.ts
        feature.ts
      DdbToOpenSearchHandler/
        implementation.ts
        feature.ts
      DdbToOpenSearchFeature.ts     # composite — registers base + DDB features
    marshall.ts
    createDdbToOpenSearchStreamHandler.ts
    index.ts
```

### DdbOperationsBuilder

Implements `OperationsBuilder` abstraction for `DynamoDBRecord`.

```ts
// features/DdbOperationsBuilder/implementation.ts
// - Resolves CompressionHandler from container
// - Receives DynamoDBRecord[], unmarshalls keys/images
// - Decompresses data via CompressionHandler
// - Calls Operations.insert/modify/delete
// - Same logic as current OperationsBuilder class
```

### DdbToOpenSearchHandler

Implements `DynamoDBEventHandler` abstraction.

```ts
// features/DdbToOpenSearchHandler/implementation.ts
// - Resolves: OperationsBuilder, ExecuteSyncWithRetry, OpenSearchClient
// - Receives DynamoDBStreamEvent
// - Builds operations from event records
// - Executes with retry
// - Same logic as current DdbToEsLambdaHandler
```

### DdbToOpenSearchFeature (Composite)

Single entry point. Registers everything.

```ts
// features/DdbToOpenSearchFeature.ts
import { createFeature } from "@webiny/feature/api";
import type { Client } from "@webiny/api-opensearch/client.js";

// Base features
import { ExecuteSyncFeature } from "@webiny/api-sync-to-opensearch/features/ExecuteSync/feature.js";
import { ExecuteSyncWithRetryFeature } from "@webiny/api-sync-to-opensearch/features/ExecuteSyncWithRetry/feature.js";
import { SynchronizationBuilderFeature } from "@webiny/api-sync-to-opensearch/features/SynchronizationBuilder/feature.js";

// DDB-specific features
import { DdbOperationsBuilderFeature } from "./DdbOperationsBuilder/feature.js";
import { DdbToOpenSearchHandlerFeature } from "./DdbToOpenSearchHandler/feature.js";

// External features
import { OpenSearchClientFeature } from "@webiny/api-opensearch/features/OpenSearchClient/feature.js";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";

export interface DdbToOpenSearchFeatureConfig {
    client: Client;
}

export const DdbToOpenSearchFeature = createFeature<DdbToOpenSearchFeatureConfig>({
    name: "sync.ddb-to-opensearch",
    register(container, config) {
        // External
        OpenSearchClientFeature.register(container, config.client);
        CompressionFeature.register(container);

        // Base sync features
        ExecuteSyncFeature.register(container);
        ExecuteSyncWithRetryFeature.register(container);
        SynchronizationBuilderFeature.register(container);

        // DDB-specific
        DdbOperationsBuilderFeature.register(container);
        DdbToOpenSearchHandlerFeature.register(container);
    }
});
```

### createDdbToOpenSearchStreamHandler

Factory function for Lambda use. Creates container, registers composite feature, returns handler.

```ts
// createDdbToOpenSearchStreamHandler.ts
import { Container } from "@webiny/feature/api";
import { RequestContainer } from "@webiny/event-handler-core";
import { DynamoDBEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/DynamoDBEventHandler.js";
import { TimerFeature } from "@webiny/utils/features/Timer/feature.js";
import { DdbToOpenSearchFeature } from "./features/DdbToOpenSearchFeature.js";
import type { Client } from "@webiny/api-opensearch/client.js";
import type { DynamoDBStreamEvent } from "@webiny/aws-sdk/types/index.js";

export type DdbToOpenSearchStreamHandler = (event: DynamoDBStreamEvent) => Promise<void>;

export const createDdbToOpenSearchStreamHandler = (client: Client): DdbToOpenSearchStreamHandler => {
    const container = new Container();
    container.registerInstance(RequestContainer, container);

    // Timer registered here by the Lambda bootstrap (not inside composite feature)
    // because timer source (Lambda context) is environment-specific
    TimerFeature.register(container, { getRemainingSeconds: () => 900 });

    DdbToOpenSearchFeature.register(container, { client });

    const handler = container.resolve(DynamoDBEventHandler);

    return async (event: DynamoDBStreamEvent): Promise<void> => {
        await handler.execute({ event, metadata: {} }, () => Promise.resolve());
    };
};
```

### Dependencies (package.json)

```json
{
    "@webiny/api-sync-to-opensearch": "0.0.0",
    "@webiny/api-opensearch": "0.0.0",
    "@webiny/aws-sdk": "0.0.0",
    "@webiny/event-handler-aws": "0.0.0",
    "@webiny/event-handler-core": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/handler-aws": "0.0.0",
    "@webiny/utils": "0.0.0"
}
```

## Timer Abstraction: `@webiny/utils`

### New Files

```
packages/utils/src/features/Timer/
  abstraction.ts
  feature.ts
```

```ts
// abstraction.ts
import { createAbstraction } from "@webiny/feature/api";

export interface ITimer {
    getRemainingSeconds(): number;
}

export const Timer = createAbstraction<ITimer>("Timer");

export namespace Timer {
    export type Interface = ITimer;
}
```

```ts
// feature.ts
import { createFeature } from "@webiny/feature/api";
import { Timer } from "./abstraction.js";

export const TimerFeature = createFeature<Timer.Interface>({
    name: "utils.timer",
    register(container, timer) {
        container.registerInstance(Timer, timer);
    }
});
```

### Cleanup in `@webiny/handler-aws`

The following timer files exist in `handler-aws`:
- `src/utils/timer/abstractions/ITimer.ts` — old interface
- `src/utils/timer/Timer.ts` — Lambda timer implementation
- `src/utils/timer/CustomTimer.ts` — custom timer
- `src/utils/timer/factory.ts` — timer factory (`timerFactory()`)
- `src/utils/timer/index.ts` — barrel export

**Scope of this work:** Migrate `api-sync-to-opensearch` consumers to the new `@webiny/utils` Timer. The `handler-aws` timer module is also consumed by `background-tasks-aws` (LambdaTimer) and other packages — migrating those consumers to the canonical `@webiny/utils` Timer is a follow-up effort, not part of this PR. The `handler-aws` timer files remain until all consumers are migrated.

## Consumer Updates

### `api-elasticsearch-tasks`

`ElasticsearchSynchronize.ts` currently calls `createSynchronizationBuilder()`. After refactor: resolve `SynchronizationBuilder` from container.

```ts
// Before
import { createSynchronizationBuilder } from "@webiny/api-sync-to-opensearch";
const builder = createSynchronizationBuilder({ openSearchClient, timer });

// After
const builder = this.container.resolve(SynchronizationBuilder);
```

### `project-aws-template` / `project-aws/_templates`

Import path changes: `@webiny/api-dynamodb-to-elasticsearch` becomes `@webiny/api-sync-ddb-to-opensearch`.

### `api-headless-cms-ddb-es`

Dependency rename in `package.json` and `tsconfig` references.

## Tests

| Test file | Package | Reason |
|---|---|---|
| `Operations.test.ts` | base (`api-sync-to-opensearch`) | Pure OpenSearch bulk logic |
| `OperationsBuilder.test.ts` | adapter (`api-sync-ddb-to-opensearch`) | DDB record parsing |
| `event.test.ts` | adapter | DDB stream event shape |
| `transfer.test.ts` | adapter | E2E handler + stream event |
| `mocks/context.ts` | adapter | Test support for DDB tests |

## Migration Path

1. Create Timer abstraction in `@webiny/utils`
2. Create base package abstractions and implementations
3. Create DDB adapter package with composite feature
4. Update consumers
5. Delete old `handler-aws` timer code
6. Update all tsconfig references and package.json deps
