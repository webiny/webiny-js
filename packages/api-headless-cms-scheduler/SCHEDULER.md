# Scheduler Migration Plan - Generic Action Scheduler

## Overview

This document outlines the migration plan for refactoring the scheduler package from a CMS-specific implementation to a **generic action scheduler** that can be used by any application (Headless CMS, Mailer, Website Builder, etc.). The scheduler will use DI container, abstractions, and follow the same patterns as EventPublisher with EventHandlers.

## Current State Analysis

### Current Architecture (CMS-Specific)

**Package Name**: `@webiny/api-headless-cms-scheduler`

**Current Design**:
- Tightly coupled to Headless CMS
- Hard-coded `ScheduleType` enum (`publish`, `unpublish`)
- `targetModel` is CMS model
- **Two different "action" patterns** (confusing):
  1. **Scheduling side** (`scheduler/actions/`): `PublishScheduleAction`, `UnpublishScheduleAction` - handle creating schedules
  2. **Execution side** (`handler/actions/`): `PublishHandlerAction`, `UnpublishHandlerAction` - handle executing schedules
- Factory pattern creates scheduler per model
- Manual instantiation with no DI
- `reschedule()` method mixed with `schedule()` logic

**Current Flow - Scheduling Side**:
```
GraphQL Mutation
  → context.cms.scheduler(model)
  → scheduler.schedule(entryId, { type: "publish" })
  → ScheduleExecutor.schedule()
  → PublishScheduleAction (decides: immediate vs. future, create vs. reschedule)
       ├─ immediate → publishes entry directly
       ├─ past date → updates metadata + publishes
       └─ future date → creates DB entry + AWS EventBridge schedule
```

**Current Flow - Execution Side**:
```
AWS EventBridge (at scheduled time)
  → Lambda invocation
  → Handler.handle()
  → PublishHandlerAction.handle()
  → cms.publishEntry()
  → Delete schedule entry
```

### Problems with Current Implementation

1. **Not Reusable** - Only works for CMS entries
2. **Hard-coded Types** - Can't schedule emails, page deletions, etc.
3. **Two Action Patterns** - Confusing: scheduling actions vs. execution actions
4. **Mixed Concerns** - Scheduling logic mixed with execution logic (immediate publish)
5. **Tight Coupling** - Actions know about CMS models
6. **No Abstraction** - Manual instantiation everywhere
7. **God Object** - `context.cms.scheduler` is growing
8. **No Extensibility** - Adding new action types requires code changes
9. **Reschedule Complexity** - Separate `reschedule()` method instead of smart `schedule()`

## Proposed Architecture - Generic Scheduler

### Core Concept

The scheduler becomes a **generic action scheduler** similar to how EventPublisher works:

- **EventPublisher** publishes events → **EventHandlers** handle them
- **Scheduler** schedules actions → **ScheduledActionHandlers** execute them

### Key Design Decisions

1. **Action Identifier**: Hierarchical string format `{namespace}/{entity}/{operation}`
   - Examples: `"Cms/Entry/Publish"`, `"Mailer/Email/Send"`, `"Website/Page/Delete"`

2. **No CMS-specific logic in core** - All CMS logic moves to handlers

3. **Apps register handlers** - Just like event handlers

4. **Method parameter pattern** - `actionId` passed as parameter (varies per request)

5. **No god objects** - No `context.cms.scheduler`, use `context.container` to register and resolve implementations

6. **Single action pattern** - Only `ScheduledActionHandler` (execution side)
   - Scheduling side is generic use case logic (no action-specific behavior)

7. **No separate reschedule** - `schedule()` detects existing schedules and updates them

8. **No immediate execution in scheduler** - Apps use direct methods for immediate actions

### Package Structure

```
packages/
├── api-scheduler/                          # Generic scheduler (new)
│   └── src/
│       ├── shared/
│       │   └── abstractions.ts             # Shared abstractions (ScheduledActionHandler, IScheduledAction, etc.)
│       └── features/
│           ├── ScheduleAction/
│           │   ├── abstractions.ts
│           │   ├── ScheduleActionUseCase.ts
│           │   └── feature.ts
│           ├── CancelScheduledAction/
│           │   ├── abstractions.ts
│           │   ├── CancelScheduledActionUseCase.ts
│           │   └── feature.ts
│           ├── GetScheduledAction/
│           │   ├── abstractions.ts
│           │   ├── GetScheduledActionUseCase.ts
│           │   └── feature.ts
│           ├── ListScheduledActions/
│           │   ├── abstractions.ts
│           │   ├── ListScheduledActionsUseCase.ts
│           │   └── feature.ts
│           └── ExecuteScheduledAction/
│               ├── abstractions.ts
│               ├── ExecuteScheduledActionUseCase.ts
│               └── feature.ts
│
└── api-headless-cms-scheduler/                       # CMS handlers
    └── src/
        └── features/
            └── scheduler/
                ├── handlers/
                │   ├── CmsEntryPublishHandler.ts
                │   └── CmsEntryUnpublishHandler.ts
                ├── graphql/
                │   └── resolvers.ts             # CMS-specific GraphQL
                ├── feature.ts
                └── constants.ts
```

We need a new `api-headless-cms-scheduler` package for CMS-specific implementations, because `api-scheduler` internally depends on `api-headless-cms` for internal storage, and we would get a circular dependency.

## Detailed Architecture

### Feature Structure

```
src/
├── index.ts                                 # Exports
└── features/
    ├── shared/
    │   └── abstractions.ts                  # Shared abstractions (ScheduledActionHandler, IScheduledAction, etc.)
    ├── ScheduleAction/
    │   ├── abstractions.ts                  # ScheduleActionUseCase abstraction
    │   ├── ScheduleActionUseCase.ts         # Implementation
    │   └── feature.ts                       # Feature registration
    ├── CancelScheduledAction/
    │   ├── abstractions.ts                  # CancelScheduledActionUseCase abstraction
    │   ├── CancelScheduledActionUseCase.ts  # Implementation
    │   └── feature.ts                       # Feature registration
    ├── GetScheduledAction/
    │   ├── abstractions.ts                  # GetScheduledActionUseCase abstraction
    │   ├── GetScheduledActionUseCase.ts     # Implementation
    │   └── feature.ts                       # Feature registration
    ├── ListScheduledActions/
    │   ├── abstractions.ts                  # ListScheduledActionsUseCase abstraction
    │   ├── ListScheduledActionsUseCase.ts   # Implementation
    │   └── feature.ts                       # Feature registration
    └── ExecuteScheduledAction/
        ├── abstractions.ts                  # ExecuteScheduledActionUseCase abstraction
        ├── ExecuteScheduledActionUseCase.ts # Implementation
        └── feature.ts                       # Feature registration
```

### Consumer App Structure (Headless CMS Example)

```
packages/api-headless-cms-scheduler/src/features/scheduler/
├── handlers/
│   ├── CmsEntryPublishHandler.ts
│   └── CmsEntryUnpublishHandler.ts
├── graphql/
│   └── resolvers.ts                         # CMS-specific GraphQL
├── feature.ts                               # Registers CMS handlers
└── constants.ts                             # Action ID constants
```

## Architecture Clarification: Scheduling vs. Execution

### The Two Sides of Scheduling

**OLD Architecture** had two confusing "action" patterns:
- `scheduler/actions/PublishScheduleAction` - **Scheduling side** (create schedule)
- `handler/actions/PublishHandlerAction` - **Execution side** (execute schedule)

**NEW Architecture** has clear separation:

#### 1. Scheduling Side (Generic Use Cases)

**What**: Creating, updating, canceling schedules
**When**: User calls GraphQL mutation to schedule an action
**Where**: `ScheduleActionUseCase`, `CancelScheduledActionUseCase`

**Logic (Generic)**:
```
// ScheduleActionUseCase.execute()
1. Validate schedule date is in future
2. Check if schedule already exists
   - If exists: UPDATE existing schedule (reschedule)
   - If new: CREATE new schedule
3. Store schedule entry in database
4. Create/update EventBridge schedule
5. Return scheduled action
```

**Key Point**: This code knows NOTHING about publishing, emails, or any specific action. It just manages schedules.

**Files to DELETE from old architecture**:
- ❌ `scheduler/actions/PublishScheduleAction.ts`
- ❌ `scheduler/actions/UnpublishScheduleAction.ts`
- ❌ `scheduler/ScheduleExecutor.ts`
- ❌ `scheduler/ScheduleFetcher.ts`

#### 2. Execution Side (Orchestration + Handlers)

**What**: Executing scheduled actions when EventBridge triggers
**When**: EventBridge invokes Lambda at scheduled time
**Where**: `ExecuteScheduledActionUseCase` orchestrates, `ScheduledActionHandler` implementations execute

**Logic (Orchestration - Generic)**:
```
// ExecuteScheduledActionUseCase.execute()
1. Fetch schedule entry from storage
2. Set identity to the user who scheduled the action
3. Get target model/context
4. Find appropriate handler by actionId
5. Execute handler
6. Delete schedule entry on success
7. Update with error on failure
```

**Logic (Handler - Action-Specific)**:
```
// CmsEntryPublishHandler.handle()
1. Parse action data (targetId, payload)
2. Execute business logic (publish entry, send email, etc.)
3. Return success/failure
```

**Key Point**: `ExecuteScheduledActionUseCase` handles orchestration (generic), handlers contain business logic (app-specific).

**Files to KEEP and migrate**:
- ✅ `ProcessRecordsUseCase.ts` → rename to `ExecuteScheduledActionUseCase.ts` (generic orchestration)
- ✅ `PublishRecordAction.ts` → becomes `CmsEntryPublishHandler.ts` in api-headless-cms-scheduler
- ✅ `UnpublishRecordAction.ts` → becomes `CmsEntryUnpublishHandler.ts` in api-headless-cms-scheduler

### What About `reschedule()`?

**OLD**: Separate `reschedule()` method in `PublishScheduleAction`
```typescript
if (original) {
    return action.reschedule(original, input);
}
return action.schedule(params);
```

**NEW**: Smart `schedule()` use case that detects existing schedules
```typescript
// ScheduleActionUseCase.execute()
const existing = await this.fetcher.get(scheduleId);

if (existing) {
    // UPDATE existing schedule
    await this.updateEntry(...);
    await this.eventBridge.update(...);
} else {
    // CREATE new schedule
    await this.createEntry(...);
    await this.eventBridge.create(...);
}
```

**Key Point**: "Reschedule" is just "schedule with existing record". No separate method needed.

### What About Immediate Execution?

**OLD**: `PublishScheduleAction` handles immediate execution
```typescript
if (input.immediately) {
    await this.cms.publishEntry(this.targetModel, targetId);
    return createScheduleRecord(...);
}
```

**NEW**: Apps don't use scheduler for immediate execution

**CMS GraphQL Resolver**:
```typescript
// For immediate publish
if (args.immediately) {
    const publishUseCase = context.container.resolve(PublishEntryUseCase);
    return publishUseCase.execute(model, entryId);
}

// For scheduled publish
const scheduleUseCase = context.container.resolve(ScheduleActionUseCase);
return scheduleUseCase.execute(
    "Cms/Entry/Publish",
    entryId,
    { scheduleOn: args.scheduleOn },
    { model }
);
```

**Key Point**: Scheduler is ONLY for future actions. Immediate actions use direct use cases.

## Migration Steps

### Phase 1: Create Shared Abstractions

**File**: `src/abstractions.ts`

#### 1.1 Scheduled Action Data Types

```typescript
/**
 * Scheduled Action Record - The data stored for a scheduled action
 */
export interface IScheduledAction {
    id: string;
    actionId: string;        // "Cms/Entry/Publish", "Mailer/Email/Send"
    targetId: string;        // Resource identifier (entry ID, email ID, etc.)
    scheduledBy: Identity;
    scheduledOn: Date;
    payload?: any;           // Action-specific data
    error?: string;          // Error if execution failed
}

/**
 * Scheduler Input - When to schedule
 */
export interface ISchedulerInput {
    scheduleOn: Date;        // Future date (required)
}

/**
 * List Parameters
 */
export interface ISchedulerListParams {
    where?: {
        actionId?: string;
        targetId?: string;
        scheduledBy?: string;
        scheduledOn_gte?: string;
        scheduledOn_lte?: string;
    };
    sort?: Array<string>;
    limit?: number;
    after?: string;
}

export interface ISchedulerListResponse {
    data: IScheduledAction[];
    meta: {
        hasMoreItems: boolean;
        totalCount: number;
        cursor: string | null;
    };
}
```

#### 1.2 ScheduledActionHandler Abstraction

```typescript
/**
 * ScheduledActionHandler - Similar to EventHandler pattern
 *
 * Each application (CMS, Mailer, etc.) implements handlers for their actions.
 * This is the ONLY action abstraction needed.
 */
export interface IScheduledActionHandler {
    /**
     * Determines if this handler can handle the given action
     */
    canHandle(actionId: string): boolean;

    /**
     * Executes the scheduled action
     */
    handle(action: IScheduledAction): Promise<void>;
}

export const ScheduledActionHandler = createAbstraction<IScheduledActionHandler>(
    "ScheduledActionHandler"
);

export namespace ScheduledActionHandler {
    export type Interface = IScheduledActionHandler;
}
```

#### 1.3 Core Use Case Abstractions

```typescript
/**
 * ScheduleActionUseCase - Schedule an action for future execution
 *
 * Handles both new schedules and rescheduling (update) automatically
 */
export interface IScheduleActionUseCase {
    execute(
        actionId: string,
        targetId: string,
        input: ISchedulerInput,
        payload?: any
    ): Promise<IScheduledAction>;
}

export const ScheduleActionUseCase = createAbstraction<IScheduleActionUseCase>(
    "ScheduleActionUseCase"
);

export namespace ScheduleActionUseCase {
    export type Interface = IScheduleActionUseCase;
}

/**
 * CancelScheduledActionUseCase - Cancel a scheduled action
 */
export interface ICancelScheduledActionUseCase {
    execute(id: string): Promise<IScheduledAction>;
}

export const CancelScheduledActionUseCase = createAbstraction<ICancelScheduledActionUseCase>(
    "CancelScheduledActionUseCase"
);

export namespace CancelScheduledActionUseCase {
    export type Interface = ICancelScheduledActionUseCase;
}

/**
 * GetScheduledActionUseCase - Get a single scheduled action
 */
export interface IGetScheduledActionUseCase {
    execute(id: string): Promise<IScheduledAction | null>;
}

export const GetScheduledActionUseCase = createAbstraction<IGetScheduledActionUseCase>(
    "GetScheduledActionUseCase"
);

export namespace GetScheduledActionUseCase {
    export type Interface = IGetScheduledActionUseCase;
}

/**
 * ListScheduledActionsUseCase - List scheduled actions with filtering
 */
export interface IListScheduledActionsUseCase {
    execute(params: ISchedulerListParams): Promise<ISchedulerListResponse>;
}

export const ListScheduledActionsUseCase = createAbstraction<IListScheduledActionsUseCase>(
    "ListScheduledActionsUseCase"
);

export namespace ListScheduledActionsUseCase {
    export type Interface = IListScheduledActionsUseCase;
}
```

#### 1.4 Infrastructure Abstractions

```typescript
/**
 * ExecuteScheduledActionUseCase - Orchestrates execution of scheduled actions
 *
 * This is a use case, not just an executor. It handles:
 * - Fetching schedule entry
 * - Setting identity
 * - Finding appropriate handler
 * - Executing handler
 * - Cleanup/error handling
 */
export interface IExecuteScheduledActionUseCase {
    execute(payload: any): Promise<void>;
}

export const ExecuteScheduledActionUseCase = createAbstraction<IExecuteScheduledActionUseCase>(
    "ExecuteScheduledActionUseCase"
);

export namespace ExecuteScheduledActionUseCase {
    export type Interface = IExecuteScheduledActionUseCase;
}

/**
 * EventBridgeSchedulerService - AWS EventBridge wrapper
 */
export interface IEventBridgeSchedulerService {
    create(params: { id: string; scheduleOn: Date; payload: any }): Promise<void>;
    update(params: { id: string; scheduleOn: Date; payload: any }): Promise<void>;
    delete(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
}

export const EventBridgeSchedulerService = createAbstraction<IEventBridgeSchedulerService>(
    "EventBridgeSchedulerService"
);

export namespace EventBridgeSchedulerService {
    export type Interface = IEventBridgeSchedulerService;
}
```

### Phase 2: Implement Features

#### 2.1 ExecuteScheduledAction Feature

**File**: `features/ExecuteScheduledAction/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/api";

export interface IExecuteScheduledActionUseCase {
    execute(payload: any): Promise<void>;
}

export const ExecuteScheduledActionUseCase = createAbstraction<IExecuteScheduledActionUseCase>(
    "ExecuteScheduledActionUseCase"
);

export namespace ExecuteScheduledActionUseCase {
    export type Interface = IExecuteScheduledActionUseCase;
}
```

**File**: `features/ExecuteScheduledAction/ExecuteScheduledActionUseCase.ts`

```typescript
import { WebinyError } from "@webiny/error";
import { ExecuteScheduledActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ScheduledActionHandler } from "~/abstractions.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/abstractions.js";

/**
 * Orchestrates execution of scheduled actions
 *
 * Responsibilities:
 * - Fetch schedule entry from storage
 * - Set identity to the user who scheduled the action
 * - Find appropriate handler by actionId
 * - Execute handler
 * - Delete schedule entry on success or update with error
 *
 * This is similar to the current ProcessRecordsUseCase but generic.
 */
class ExecuteScheduledActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private handlers: ScheduledActionHandler.Interface[],
        private getScheduledAction: GetScheduledActionUseCase.Interface,
        // TODO: Add identity context, CMS use cases (GetModel, UpdateEntry, DeleteEntry)
    ) {}

    async execute(payload: any): Promise<void> {
        // 1. Extract schedule ID from payload
        const { id, actionId, targetId } = payload.ScheduledAction;

        // 2. Fetch schedule entry
        const scheduledAction = await this.getScheduledAction.execute(id);

        if (!scheduledAction) {
            throw new WebinyError(`Scheduled action not found: ${id}`, "NOT_FOUND");
        }

        // 3. Set identity to original scheduler
        // TODO: this.identityContext.setIdentity(scheduledAction.scheduledBy);

        // 4. Find appropriate handler
        const handler = this.handlers.find(h => h.canHandle(scheduledAction.actionId));

        if (!handler) {
            // Update schedule entry with error
            // TODO: await this.updateEntry(..., { error: "No handler found" });

            throw new WebinyError(
                `No handler found for action: ${scheduledAction.actionId}`,
                "NO_HANDLER_FOUND",
                { actionId: scheduledAction.actionId, targetId: scheduledAction.targetId }
            );
        }

        // 5. Execute handler
        try {
            await handler.handle(scheduledAction);
        } catch (ex) {
            // Update schedule entry with error
            // TODO: await this.updateEntry(..., { error: ex.message });
            throw ex;
        }

        // 6. Delete schedule entry on success
        // TODO: await this.deleteEntry(...);
    }
}

export const ExecuteScheduledActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: ExecuteScheduledActionUseCaseImpl,
    dependencies: [
        [ScheduledActionHandler, { multiple: true }],
        GetScheduledActionUseCase,
        // TODO: Add IdentityContext, CMS use cases
    ]
});
```

**File**: `features/ExecuteScheduledAction/feature.ts`

```typescript
import { createFeature } from "@webiny/feature/api";
import { ExecuteScheduledActionUseCase } from "./ExecuteScheduledActionUseCase.js";

export const ExecuteScheduledActionFeature = createFeature({
    name: "ExecuteScheduledAction",
    register(container) {
        container.register(ExecuteScheduledActionUseCase);
    }
});
```

#### 2.2 ScheduleAction Feature

**File**: `features/ScheduleAction/abstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { IScheduledAction, ISchedulerInput } from "~/abstractions.js";

export interface IScheduleActionUseCase {
    execute(
        actionId: string,
        targetId: string,
        input: ISchedulerInput,
        payload?: any
    ): Promise<IScheduledAction>;
}

export const ScheduleActionUseCase = createAbstraction<IScheduleActionUseCase>(
    "ScheduleActionUseCase"
);

export namespace ScheduleActionUseCase {
    export type Interface = IScheduleActionUseCase;
}
```

**File**: `features/ScheduleAction/ScheduleActionUseCase.ts`

```typescript
// Implementation similar to current ScheduleActionUseCase
// See Phase 3.1 below for full implementation
```

**File**: `features/ScheduleAction/feature.ts`

```typescript
import { createFeature } from "@webiny/feature/api";
import { ScheduleActionUseCase } from "./ScheduleActionUseCase.js";

export const ScheduleActionFeature = createFeature({
    name: "ScheduleAction",
    register(container) {
        container.register(ScheduleActionUseCase);
    }
});
```

#### 2.3 Other Features

The following features follow the same pattern (abstractions.ts + UseCase.ts + feature.ts):

- **CancelScheduledAction** - See Phase 3.2
- **GetScheduledAction** - See Phase 3.3
- **ListScheduledActions** - See Phase 3.4

#### 2.4 Shared Infrastructure (EventBridgeSchedulerService)

**Note**: `EventBridgeSchedulerService` is NOT a feature, it's infrastructure registered globally.

**File**: `src/EventBridgeSchedulerService.ts`

```typescript
import { EventBridgeSchedulerService as ServiceAbstraction } from "./abstractions.js";
import { WebinyError } from "@webiny/error";
import {
    CreateScheduleCommand,
    UpdateScheduleCommand,
    DeleteScheduleCommand,
    GetScheduleCommand
} from "@webiny/aws-sdk/client-scheduler";

/**
 * AWS EventBridge Scheduler wrapper
 */
class EventBridgeSchedulerServiceImpl implements ServiceAbstraction.Interface {
    constructor(
        private getClient: (config?: any) => any, // Scheduler client factory
        private config: { lambdaArn: string; roleArn: string }
    ) {}

    async create(params: { id: string; scheduleOn: Date; payload: any }): Promise<void> {
        const { id, scheduleOn, payload } = params;

        if (scheduleOn <= new Date()) {
            throw new WebinyError(
                "Cannot schedule in the past",
                "INVALID_SCHEDULE_DATE",
                { scheduleOn }
            );
        }

        const client = this.getClient();

        await client.send(new CreateScheduleCommand({
            Name: id,
            ScheduleExpression: `at(${scheduleOn.toISOString().replace(/\.\d{3}Z$/, "")})`,
            FlexibleTimeWindow: { Mode: "OFF" },
            Target: {
                Arn: this.config.lambdaArn,
                RoleArn: this.config.roleArn,
                Input: JSON.stringify(payload)
            },
            ActionAfterCompletion: "DELETE"
        }));
    }

    async update(params: { id: string; scheduleOn: Date; payload: any }): Promise<void> {
        // Similar to create but uses UpdateScheduleCommand
    }

    async delete(id: string): Promise<void> {
        const client = this.getClient();
        await client.send(new DeleteScheduleCommand({ Name: id }));
    }

    async exists(id: string): Promise<boolean> {
        try {
            const client = this.getClient();
            await client.send(new GetScheduleCommand({ Name: id }));
            return true;
        } catch (ex) {
            if (ex.name === "ResourceNotFoundException") {
                return false;
            }
            throw ex;
        }
    }
}

export const EventBridgeSchedulerService = ServiceAbstraction.createImplementation({
    implementation: EventBridgeSchedulerServiceImpl,
    dependencies: [
        // Registered as instances/factories in context
        SchedulerClientFactory,
        SchedulerConfig
    ]
});
```

### Phase 3: Implement Use Cases

#### 3.1 ScheduleActionUseCase

**File**: `features/Scheduler/ScheduleActionUseCase.ts`

```typescript
import { ScheduleActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetScheduledActionUseCase } from "./abstractions.js";
import { EventBridgeSchedulerService } from "./abstractions.js";
import type { IScheduledAction, ISchedulerInput } from "./abstractions.js";

/**
 * Schedules an action for future execution
 *
 * Flow:
 * 1. Check if already scheduled (reschedule if exists)
 * 2. Validate schedule date is in future
 * 3. Create/update schedule entry in storage
 * 4. Create/update EventBridge schedule
 *
 * Note: Does NOT handle immediate execution - apps use direct use cases for that
 */
class ScheduleActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getScheduledAction: GetScheduledActionUseCase.Interface,
        private eventBridge: EventBridgeSchedulerService.Interface,
        private getIdentity: () => Identity, // Factory
        // TODO: Add CreateEntryUseCase, UpdateEntryUseCase
    ) {}

    async execute(
        actionId: string,
        targetId: string,
        input: ISchedulerInput,
        payload?: any
    ): Promise<IScheduledAction> {
        const identity = this.getIdentity();

        // Generate schedule ID
        const scheduleId = this.generateScheduleId(actionId, targetId);

        // Check if already scheduled (for reschedule logic)
        const existing = await this.getScheduledAction.execute(scheduleId);

        if (existing) {
            // RESCHEDULE: Update existing schedule
            await this.updateEntry(schedulerModel, scheduleId, {
                scheduledBy: identity,
                scheduledOn: input.scheduleOn,
                payload
            });

            await this.eventBridge.update({
                id: scheduleId,
                scheduleOn: input.scheduleOn,
                payload: {
                    scheduleId,
                    actionId,
                    targetId
                }
            });

            return {
                ...existing,
                scheduledBy: identity,
                scheduledOn: input.scheduleOn,
                payload
            };
        }

        // CREATE: New schedule
        const scheduledAction: IScheduledAction = {
            id: scheduleId,
            actionId,
            targetId,
            scheduledBy: identity,
            scheduledOn: input.scheduleOn,
            payload
        };

        // TODO: Use CreateEntryUseCase
        await this.createEntry(schedulerModel, scheduledAction);

        // Create EventBridge schedule
        try {
            await this.eventBridge.create({
                id: scheduleId,
                scheduleOn: input.scheduleOn,
                payload: {
                    scheduleId,
                    actionId,
                    targetId
                }
            });
        } catch (ex) {
            // Rollback - delete entry if EventBridge fails
            await this.deleteEntry(schedulerModel, scheduleId);
            throw ex;
        }

        return scheduledAction;
    }

    private generateScheduleId(actionId: string, targetId: string): string {
        // Create unique ID from actionId + targetId
        return `${actionId.replace(/\//g, "_")}_${targetId}`;
    }
}

export const ScheduleActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: ScheduleActionUseCaseImpl,
    dependencies: [
        GetScheduledActionUseCase,
        EventBridgeSchedulerService,
        IdentityProvider, // Factory
        // TODO: Add CMS use cases
    ]
});
```

#### 3.2 CancelScheduledActionUseCase

**File**: `features/Scheduler/CancelScheduledActionUseCase.ts`

```typescript
import { CancelScheduledActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetScheduledActionUseCase } from "./abstractions.js";
import { EventBridgeSchedulerService } from "./abstractions.js";
import type { IScheduledAction } from "./abstractions.js";
import { WebinyError } from "@webiny/error";

/**
 * Cancels a scheduled action
 *
 * Flow:
 * 1. Fetch scheduled action
 * 2. Delete EventBridge schedule
 * 3. Delete storage entry
 */
class CancelScheduledActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getScheduledAction: GetScheduledActionUseCase.Interface,
        private eventBridge: EventBridgeSchedulerService.Interface,
        // TODO: Add DeleteEntryUseCase
    ) {}

    async execute(id: string): Promise<IScheduledAction> {
        const scheduledAction = await this.getScheduledAction.execute(id);

        if (!scheduledAction) {
            throw new WebinyError(
                `Scheduled action not found: ${id}`,
                "SCHEDULED_ACTION_NOT_FOUND",
                { id }
            );
        }

        // Delete EventBridge schedule
        try {
            await this.eventBridge.delete(id);
        } catch (ex) {
            // Continue even if EventBridge delete fails
            console.error("Failed to delete EventBridge schedule:", ex);
        }

        // Delete storage entry
        // TODO: Use DeleteEntryUseCase
        await this.deleteEntry(schedulerModel, id);

        return scheduledAction;
    }
}

export const CancelScheduledActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: CancelScheduledActionUseCaseImpl,
    dependencies: [
        GetScheduledActionUseCase,
        EventBridgeSchedulerService,
        // TODO: Add CMS use cases
    ]
});
```

#### 3.3 GetScheduledActionUseCase

**File**: `features/Scheduler/GetScheduledActionUseCase.ts`

```typescript
import { GetScheduledActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { IScheduledAction } from "./abstractions.js";

/**
 * Gets a single scheduled action by ID
 *
 * Fetches schedule entry from CMS storage and transforms to IScheduledAction
 */
class GetScheduledActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        // TODO: Inject GetEntryByIdUseCase from CMS
        // TODO: Inject SchedulerModel instance
    ) {}

    async execute(id: string): Promise<IScheduledAction | null> {
        try {
            // TODO: const entry = await this.getEntryById.execute(schedulerModel, id);
            // TODO: return this.transformEntry(entry);
        } catch (ex) {
            if (ex.code === "NOT_FOUND") {
                return null;
            }
            throw ex;
        }
    }

    private transformEntry(entry: any): IScheduledAction {
        return {
            id: entry.id,
            actionId: entry.values.actionId,
            targetId: entry.values.targetId,
            scheduledBy: entry.values.scheduledBy,
            scheduledOn: new Date(entry.values.scheduledOn),
            payload: entry.values.payload,
            error: entry.values.error
        };
    }
}

export const GetScheduledActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetScheduledActionUseCaseImpl,
    dependencies: [
        // TODO: Add CMS use cases
    ]
});
```

#### 3.4 ListScheduledActionsUseCase

**File**: `features/Scheduler/ListScheduledActionsUseCase.ts`

```typescript
import { ListScheduledActionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { ISchedulerListParams, ISchedulerListResponse } from "./abstractions.js";

/**
 * Lists scheduled actions with filtering
 *
 * Fetches schedule entries from CMS storage and transforms to IScheduledAction[]
 */
class ListScheduledActionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        // TODO: Inject ListLatestEntriesUseCase from CMS
        // TODO: Inject SchedulerModel instance
    ) {}

    async execute(params: ISchedulerListParams): Promise<ISchedulerListResponse> {
        // TODO: Use ListLatestEntriesUseCase
        const [data, meta] = await this.listLatestEntries.execute(schedulerModel, {
            where: params.where,
            sort: params.sort,
            limit: params.limit,
            after: params.after
        });

        return {
            data: data.map(item => this.transformEntry(item)),
            meta
        };
    }

    private transformEntry(entry: any): IScheduledAction {
        return {
            id: entry.id,
            actionId: entry.values.actionId,
            targetId: entry.values.targetId,
            scheduledBy: entry.values.scheduledBy,
            scheduledOn: new Date(entry.values.scheduledOn),
            payload: entry.values.payload,
            error: entry.values.error
        };
    }
}

export const ListScheduledActionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListScheduledActionsUseCaseImpl,
    dependencies: [
        // TODO: Add CMS use cases
    ]
});
```

### Phase 4: Register All Features in Context

**File**: `src/context.ts`

```typescript
import { ExecuteScheduledActionFeature } from "~/features/ExecuteScheduledAction/feature.js";
import { ScheduleActionFeature } from "~/features/ScheduleAction/feature.js";
import { CancelScheduledActionFeature } from "~/features/CancelScheduledAction/feature.js";
import { GetScheduledActionFeature } from "~/features/GetScheduledAction/feature.js";
import { ListScheduledActionsFeature } from "~/features/ListScheduledActions/feature.js";
import { EventBridgeSchedulerService } from "~/EventBridgeSchedulerService.js";

// Register all features
ExecuteScheduledActionFeature.register(context.container);
ScheduleActionFeature.register(context.container);
CancelScheduledActionFeature.register(context.container);
GetScheduledActionFeature.register(context.container);
ListScheduledActionsFeature.register(context.container);

// Register shared infrastructure
context.container.register(EventBridgeSchedulerService).inSingletonScope();

// Register manifest-based instances
context.container.registerInstance(SchedulerConfig, {
    lambdaArn: manifest.scheduler.lambdaArn,
    roleArn: manifest.scheduler.roleArn
});

context.container.registerInstance(SchedulerModel, schedulerModel);

// Register AWS client factory
context.container.registerFactory(SchedulerClientFactory, () => getClient);

// Register identity provider
context.container.registerFactory(IdentityProvider, () => security.getIdentity());
```

**Note**: Each feature is self-contained and registers only its own use case. This follows the pattern used in other packages where each feature is independent.

### Phase 5: Create CMS Handlers (Consumer App)

**File**: `packages/api-headless-cms/src/features/scheduler/handlers/CmsEntryPublishHandler.ts`

```typescript
import { ScheduledActionHandler } from "@webiny/api-scheduler";
import type { IScheduledAction } from "@webiny/api-scheduler";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CMS_ENTRY_PUBLISH_ACTION } from "../constants.js";

/**
 * Handles scheduled publish actions for CMS entries
 *
 * Action ID: "Cms/Entry/Publish"
 */
class CmsEntryPublishHandlerImpl implements ScheduledActionHandler.Interface {
    constructor(
        private publishEntry: PublishEntryUseCase.Interface,
        private getModel: GetModelUseCase.Interface
    ) {}

    canHandle(actionId: string): boolean {
        return actionId === CMS_ENTRY_PUBLISH_ACTION;
    }

    async handle(action: IScheduledAction): Promise<void> {
        // Parse targetId to extract model and entry
        // Format: "modelId#version" e.g., "product#0001"
        const [modelId, version] = action.targetId.split("#");

        // Get model (could be cached in payload for optimization)
        const model = action.payload?.model || await this.getModel.execute(modelId);

        // Execute publish
        const result = await this.publishEntry.execute(model, action.targetId);

        if (result.isFail()) {
            throw result.error;
        }
    }
}

export const CmsEntryPublishHandler = ScheduledActionHandler.createImplementation({
    implementation: CmsEntryPublishHandlerImpl,
    dependencies: [
        PublishEntryUseCase,
        GetModelUseCase
    ]
});
```

**File**: `packages/api-headless-cms/src/features/scheduler/handlers/CmsEntryUnpublishHandler.ts`

```typescript
import { ScheduledActionHandler } from "@webiny/api-scheduler";
import type { IScheduledAction } from "@webiny/api-scheduler";
import { UnpublishEntryUseCase } from "~/features/contentEntry/UnpublishEntry/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CMS_ENTRY_UNPUBLISH_ACTION } from "../constants.js";

/**
 * Handles scheduled unpublish actions for CMS entries
 *
 * Action ID: "Cms/Entry/Unpublish"
 */
class CmsEntryUnpublishHandlerImpl implements ScheduledActionHandler.Interface {
    constructor(
        private unpublishEntry: UnpublishEntryUseCase.Interface,
        private getModel: GetModelUseCase.Interface
    ) {}

    canHandle(actionId: string): boolean {
        return actionId === CMS_ENTRY_UNPUBLISH_ACTION;
    }

    async handle(action: IScheduledAction): Promise<void> {
        const [modelId, version] = action.targetId.split("#");
        const model = action.payload?.model || await this.getModel.execute(modelId);

        const result = await this.unpublishEntry.execute(model, action.targetId);

        if (result.isFail()) {
            throw result.error;
        }
    }
}

export const CmsEntryUnpublishHandler = ScheduledActionHandler.createImplementation({
    implementation: CmsEntryUnpublishHandlerImpl,
    dependencies: [
        UnpublishEntryUseCase,
        GetModelUseCase
    ]
});
```

**File**: `packages/api-headless-cms/src/features/scheduler/constants.ts`

```typescript
/**
 * CMS Scheduled Action IDs
 */
export const CMS_ENTRY_PUBLISH_ACTION = "Cms/Entry/Publish";
export const CMS_ENTRY_UNPUBLISH_ACTION = "Cms/Entry/Unpublish";
```

**File**: `packages/api-headless-cms/src/features/scheduler/feature.ts`

```typescript
import { createFeature } from "@webiny/feature/api";
import { CmsEntryPublishHandler } from "./handlers/CmsEntryPublishHandler.js";
import { CmsEntryUnpublishHandler } from "./handlers/CmsEntryUnpublishHandler.js";

/**
 * CMS Scheduler Handlers Feature
 *
 * Registers CMS-specific scheduled action handlers
 */
export const CmsSchedulerHandlersFeature = createFeature({
    name: "CmsSchedulerHandlers",
    register(container) {
        container.register(CmsEntryPublishHandler);
        container.register(CmsEntryUnpublishHandler);
    }
});
```

### Phase 6: Update Context Integration

**File**: `src/context.ts` (Generic Scheduler Package)

```typescript
// Register scheduler feature
SchedulerFeature.register(context.container);

// Register manifest-based instances
container.registerInstance(SchedulerConfig, {
    lambdaArn: manifest.scheduler.lambdaArn,
    roleArn: manifest.scheduler.roleArn
});

container.registerInstance(SchedulerModel, schedulerModel);

// Register AWS client factory
container.registerFactory(SchedulerClientFactory, () => getClient);

// Register identity provider
container.registerFactory(IdentityProvider, () => security.getIdentity());

// No context.cms.scheduler - apps use container directly
```

**File**: `packages/api-headless-cms/src/context.ts` (Consumer App)

```typescript
// Register CMS handlers
CmsSchedulerHandlersFeature.register(context.container);
```

### Phase 7: Update GraphQL Resolvers

**File**: `packages/api-headless-cms/src/features/scheduler/graphql/resolvers.ts`

**Before (old pattern):**
```typescript
const createCmsSchedule = async (_, args, context) => {
    const model = await context.cms.getModel(args.modelId);
    const scheduler = context.cms.scheduler(model);
    return scheduler.schedule(args.id, { type: "publish", scheduleOn: args.scheduleOn });
};
```

**After (new pattern):**
```typescript
import { ScheduleActionUseCase } from "@webiny/api-scheduler";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";
import { CMS_ENTRY_PUBLISH_ACTION } from "../constants.js";

const createCmsSchedule = async (_, args, context) => {
    // Get model
    const model = await context.cms.getModel(args.modelId);

    // Handle immediate execution (not via scheduler)
    if (args.immediately) {
        const publishUseCase = context.container.resolve(PublishEntryUseCase);
        const result = await publishUseCase.execute(model, args.id);

        if (result.isFail()) {
            throw result.error;
        }

        return result.value;
    }

    // Schedule for future
    const scheduleUseCase = context.container.resolve(ScheduleActionUseCase);

    const result = await scheduleUseCase.execute(
        CMS_ENTRY_PUBLISH_ACTION,        // "Cms/Entry/Publish"
        args.id,                          // Entry ID e.g., "product#0001"
        { scheduleOn: args.scheduleOn },  // When to schedule
        { model }                         // Payload (optional, for optimization)
    );

    return result;
};

const getCmsSchedule = async (_, args, context) => {
    const getUseCase = context.container.resolve(GetScheduledActionUseCase);
    return getUseCase.execute(args.id);
};

const listCmsSchedules = async (_, args, context) => {
    const listUseCase = context.container.resolve(ListScheduledActionsUseCase);
    return listUseCase.execute({
        where: {
            actionId: args.actionId,  // Filter by action ID
            ...args.where
        },
        sort: args.sort,
        limit: args.limit,
        after: args.after
    });
};

const cancelCmsSchedule = async (_, args, context) => {
    const cancelUseCase = context.container.resolve(CancelScheduledActionUseCase);
    return cancelUseCase.execute(args.id);
};
```

**Key Points**:
- CMS apps have their own GraphQL resolvers (not generic)
- Immediate execution bypasses scheduler entirely
- Each app wraps generic use cases with their own business logic

### Phase 8: Update Event Handler (Execution Side)

**File**: `src/handler/index.ts`

```typescript
import { createEventHandler } from "@webiny/handler-aws/raw/index.js";
import { ExecuteScheduledActionUseCase } from "~/features/Scheduler/index.js";

export const createScheduledActionEventHandler = () => {
    return createEventHandler({
        canHandle: event => {
            return event?.ScheduledAction?.id && event?.ScheduledAction?.actionId;
        },
        handle: async params => {
            const { payload, context } = params;

            // Resolve use case from container
            const executeUseCase = context.container.resolve(ExecuteScheduledActionUseCase);

            // Execute (this handles everything: fetch, identity, find handler, execute, cleanup)
            await executeUseCase.execute(payload);
        }
    });
};
```

**Key Points**:
- Event handler is now extremely simple - just delegates to use case
- All orchestration logic is in `ExecuteScheduledActionUseCase`
- Follows single responsibility principle

## Dependency Chain Analysis

### Before (Manual Instantiation, CMS-Specific)
```
createScheduler (factory)
  ├─ new ScheduleFetcher({ cms, targetModel, schedulerModel })
  ├─ new PublishScheduleAction({ cms, schedulerModel, targetModel, service, getIdentity, fetcher })
  ├─ new UnpublishScheduleAction({ ... })
  ├─ new ScheduleExecutor({ actions, fetcher })
  └─ new Scheduler({ fetcher, executor })
```

### After (DI Container, Generic)
```
CMS GraphQL Resolver
  ├─ Get model from args
  ├─ IF immediate: Container.resolve(PublishEntryUseCase)
  └─ IF scheduled: Container.resolve(ScheduleActionUseCase)
       │
       ├─ Inject: GetScheduledActionUseCase
       │    └─ Inject: CMS Use Cases (GetEntryById, SchedulerModel)
       │
       ├─ Inject: EventBridgeSchedulerService
       │    ├─ Inject: SchedulerClientFactory (factory)
       │    └─ Inject: SchedulerConfig (instance)
       │
       └─ Inject: IdentityProvider (factory)

  → Execute: useCase.execute(actionId, targetId, input, payload)
       │
       └─ actionId = "Cms/Entry/Publish" (passed as parameter)

Event Handler (when schedule executes)
  └─ Container.resolve(ExecuteScheduledActionUseCase)
       │
       ├─ Inject: GetScheduledActionUseCase
       │    └─ Inject: CMS Use Cases (GetEntryById, SchedulerModel)
       │
       ├─ Inject: [ScheduledActionHandler] (multiple)
       │    │
       │    ├─ CmsEntryPublishHandler (from api-headless-cms)
       │    │    ├─ Inject: PublishEntryUseCase
       │    │    └─ Inject: GetModelUseCase
       │    │
       │    ├─ CmsEntryUnpublishHandler (from api-headless-cms)
       │    │    ├─ Inject: UnpublishEntryUseCase
       │    │    └─ Inject: GetModelUseCase
       │    │
       │    └─ MailerEmailSendHandler (from api-mailer - future)
       │         └─ Inject: EmailService
       │
       └─ Inject: IdentityContext, CMS Use Cases (UpdateEntry, DeleteEntry, etc.)

  → Execute: executeUseCase.execute(payload)
       │
       ├─ Fetches schedule entry
       ├─ Sets identity to scheduler
       ├─ Finds handler by actionId
       ├─ Calls handler.handle(scheduledAction)
       └─ Cleanup (delete or update with error)
```

**Key Differences:**
- Generic `actionId` instead of CMS-specific `targetModel`
- Handlers registered by consumer apps, not built into scheduler
- No factory pattern needed
- Parallel to EventPublisher/EventHandler pattern
- Immediate execution bypasses scheduler entirely

## Files to Delete vs. Migrate

### DELETE (Old Scheduling Logic)
- ❌ `scheduler/actions/PublishScheduleAction.ts`
- ❌ `scheduler/actions/UnpublishScheduleAction.ts`
- ❌ `scheduler/ScheduleExecutor.ts`
- ❌ `scheduler/Scheduler.ts`
- ❌ `scheduler/createScheduler.ts`

### MIGRATE to Generic
- ✅ `service/SchedulerService.ts` → `EventBridgeSchedulerService.ts` (generic)

### MIGRATE to CMS Package
- ✅ `handler/actions/PublishHandlerAction.ts` → `api-headless-cms/src/features/scheduler/handlers/CmsEntryPublishHandler.ts`
- ✅ `handler/actions/UnpublishHandlerAction.ts` → `api-headless-cms/src/features/scheduler/handlers/CmsEntryUnpublishHandler.ts`
- ✅ `graphql/` → `api-headless-cms/src/features/scheduler/graphql/`

### KEEP and Update
- ✅ `ProcessRecordsUseCase.ts` → rename to `ExecuteScheduledActionUseCase.ts` (generic orchestration)
- ✅ `scheduler/model.ts` → update to generic `webinyScheduledAction` model

### NO LONGER NEEDED
- ❌ `scheduler/ScheduleFetcher.ts` - Replaced by `GetScheduledActionUseCase` and `ListScheduledActionsUseCase`

## Benefits of Generic Architecture

1. **Reusable Across Apps**
   - CMS can schedule entry publish/unpublish
   - Mailer can schedule email sending
   - Website Builder can schedule page deletion
   - Any app can schedule any action

2. **Clear Separation of Concerns**
   - Scheduling logic (generic) vs. Execution logic (app-specific)
   - No confusion between two action patterns
   - Single responsibility per class

3. **No Immediate Execution Confusion**
   - Scheduler is ONLY for future actions
   - Immediate actions use direct use cases
   - Clear boundary

4. **Smart Reschedule**
   - No separate `reschedule()` method
   - `schedule()` detects existing and updates automatically
   - Less API surface area

5. **Extensible**
   - Apps register handlers like event handlers
   - No core code changes needed for new actions
   - Type-safe with constants

6. **No God Objects**
   - No `context.cms.scheduler`
   - Direct container resolution
   - Explicit dependencies

7. **Consistent Patterns**
   - Same as EventPublisher/EventHandler
   - Same as ProcessRecords feature
   - Developers know the pattern

## Migration Strategy

### Option A: Keep CMS-Specific Package, Extract Core

```
packages/
├── scheduler-core/                  # Generic scheduler (new)
│   └── src/features/Scheduler/
│
└── api-headless-cms-scheduler/      # CMS integration (existing)
    └── src/
        ├── handlers/                # CMS handlers
        └── graphql/                 # CMS GraphQL
```

**Pros:**
- No breaking changes for consumers
- Clear separation
- Can version independently

**Cons:**
- Two packages to maintain
- Import paths change

### Option B: Rename Package to Generic

```
packages/
└── api-scheduler/                   # Generic (renamed)
    └── src/
        └── features/
            └── Scheduler/           # Core
```

CMS handlers move to:
```
packages/api-headless-cms/src/features/scheduler/
```

**Pros:**
- Single package
- Clear that it's generic
- CMS handlers where they belong

**Cons:**
- Breaking change (package rename)
- Migration effort for consumers

### Recommendation: **Option A** (Extract Core)

Start with Option A to avoid breaking changes. Later, if we want to consolidate, we can deprecate the old package.

## Data Model Changes

### Current Model: `webinyCmsSchedule`

```typescript
{
    targetId: string;         // Entry ID with version
    targetModelId: string;    // CMS model ID
    scheduledBy: Identity;
    scheduledOn: Date;
    type: "publish" | "unpublish";
    title: string;            // Entry title
    error?: string;
}
```

### New Model: `webinyScheduledAction`

```typescript
{
    id: string;               // Unique schedule ID
    actionId: string;         // "Cms/Entry/Publish", "Mailer/Email/Send"
    targetId: string;         // Resource identifier (entry ID, email ID, etc.)
    scheduledBy: Identity;
    scheduledOn: Date;
    payload?: any;            // Action-specific data (model, email data, etc.)
    error?: string;           // Execution error
}
```

## Success Criteria

- ✅ Generic scheduler works for any app (CMS, Mailer, etc.)
- ✅ No CMS-specific logic in core scheduler
- ✅ Handlers registered like event handlers
- ✅ Action IDs are hierarchical strings
- ✅ Each use case has single responsibility
- ✅ No god objects (`context.cms.scheduler` removed)
- ✅ GraphQL resolvers use `context.container` directly
- ✅ Tests pass with mocked dependencies
- ✅ New actions added via handler registration only
- ✅ Code follows EventPublisher/EventHandler pattern
- ✅ CMS scheduling works identically to before
- ✅ Can schedule non-CMS actions (email, page delete, etc.)
- ✅ No confusion between scheduling and execution logic
- ✅ No separate `reschedule()` method needed
- ✅ Immediate execution bypasses scheduler

## Future Enhancements

1. **Typed Action Schemas**
   - Define TypeScript types for each action's payload
   - Validate payloads at registration time

2. **Recurring Schedules**
   - Support cron expressions
   - Repeat actions on schedule

3. **Action Groups**
   - Schedule multiple actions together
   - All-or-nothing execution

4. **Priority Queues**
   - High-priority actions execute first
   - Background vs. urgent actions

5. **Retry Logic**
   - Automatic retry on failure
   - Exponential backoff

6. **Audit Trail**
   - Log all schedule creations/executions
   - Track who scheduled what and when

7. **UI Components**
   - Admin UI to view/manage schedules
   - Calendar view of upcoming actions

## Example: Adding Mailer Support

To demonstrate extensibility, here's how you'd add email scheduling:

**Step 1: Define Action ID**
```typescript
// packages/api-mailer/src/scheduler/constants.ts
export const MAILER_EMAIL_SEND_ACTION = "Mailer/Email/Send";
```

**Step 2: Create Handler**
```typescript
// packages/api-mailer/src/scheduler/handlers/MailerEmailSendHandler.ts
class MailerEmailSendHandlerImpl implements ScheduledActionHandler.Interface {
    constructor(private emailService: EmailService) {}

    canHandle(actionId: string): boolean {
        return actionId === MAILER_EMAIL_SEND_ACTION;
    }

    async handle(action: IScheduledAction): Promise<void> {
        // Payload contains email data
        const { to, subject, body, from } = action.payload;

        await this.emailService.send({
            to,
            subject,
            body,
            from
        });
    }
}

export const MailerEmailSendHandler = ScheduledActionHandler.createImplementation({
    implementation: MailerEmailSendHandlerImpl,
    dependencies: [EmailService]
});
```

**Step 3: Register Handler**
```typescript
// packages/api-mailer/src/scheduler/feature.ts
export const MailerSchedulerHandlersFeature = createFeature({
    name: "MailerSchedulerHandlers",
    register(container) {
        container.register(MailerEmailSendHandler);
    }
});

// In context.ts
MailerSchedulerHandlersFeature.register(context.container);
```

**Step 4: Use in GraphQL/API**
```typescript
const scheduleEmail = async (_, args, context) => {
    const scheduleUseCase = context.container.resolve(ScheduleActionUseCase);

    return scheduleUseCase.execute(
        MAILER_EMAIL_SEND_ACTION,
        `email-${generateId()}`,
        { scheduleOn: args.sendAt },
        {
            to: args.to,
            subject: args.subject,
            body: args.body,
            from: args.from
        }
    );
};
```

**Done!** No changes to core scheduler needed.

## References

- ProcessRecords feature: `src/features/ProcessRecords/`
- EventPublisher pattern: `@webiny/event-publisher`
- DI Container docs: `ai-context/di-container.md`
- Current architecture: `ARCHITECTURE.md`
