# Scheduler Migration Plan

## Overview

This document outlines the migration plan for refactoring the scheduler component (`src/scheduler/`) to utilize the DI container, abstractions, and the features architecture pattern. The goal is to align the scheduler implementation with the same patterns used in the ProcessRecords feature.

## Current State Analysis

### Current Architecture

**Factory Pattern (`createScheduler.ts`)**
- Factory function creates model-specific scheduler instances
- Manually instantiates actions: `new PublishScheduleAction()`, `new UnpublishScheduleAction()`
- No DI container usage - tight coupling
- Comment exists: `// TODO: inject actions!!!` (line 51)

**Core Components**
1. **Scheduler** - Main interface (composition pattern)
2. **ScheduleExecutor** - Coordinates action execution
3. **ScheduleFetcher** - Retrieves schedule records
4. **Schedule Actions** - PublishScheduleAction, UnpublishScheduleAction (implement IScheduleAction)
5. **SchedulerService** - AWS EventBridge wrapper

### Current Dependency Flow
```
createScheduler (factory)
  ↓
Manually creates:
  - ScheduleFetcher
  - PublishScheduleAction (with many dependencies)
  - UnpublishScheduleAction (with many dependencies)
  - ScheduleExecutor (with actions array)
  - Scheduler (with fetcher + executor)
```

## Problems with Current Implementation

1. **Tight Coupling**: Actions are manually instantiated with all dependencies
2. **No Abstraction Layer**: No proper abstraction for Scheduler, Executor, or Fetcher
3. **Testing Difficulty**: Cannot easily mock dependencies
4. **Extensibility Issues**: Adding new schedule types requires modifying factory
5. **Inconsistent Patterns**: Handler layer uses DI but scheduler doesn't
6. **Repeated Dependency Injection**: Each action receives same CMS dependencies manually

## Proposed Architecture

### Feature Structure

```
src/features/Scheduler/
├── abstractions.ts                          # All abstractions
├── index.ts                                 # Exports
├── feature.ts                               # Feature registration
├── ScheduleExecutorUseCase.ts               # Executor with DI
├── ScheduleFetcherUseCase.ts                # Fetcher with DI
├── ScheduleRecordUseCase.ts                 # Command: Schedule a record
├── CancelScheduledRecordUseCase.ts          # Command: Cancel a schedule
├── GetScheduledRecordUseCase.ts             # Query: Get single schedule
├── ListScheduledRecordsUseCase.ts           # Query: List schedules
├── ValidateNotPrivateModelDecorator.ts      # Validation decorator
├── EventBridgeSchedulerService.ts           # AWS EventBridge wrapper
└── actions/
    ├── PublishScheduleAction.ts             # Publish action with DI
    └── UnpublishScheduleAction.ts           # Unpublish action with DI
```

## Migration Steps

### Phase 1: Create Abstractions

**File**: `features/Scheduler/abstractions.ts`

Create the following abstractions:

1. **ScheduleAction** - Abstraction for schedule actions (already exists as interface `IScheduleAction`)
   ```typescript
   export const ScheduleAction = createAbstraction<IScheduleAction>("ScheduleAction");
   ```

2. **ScheduleFetcher** - Abstraction for fetching schedule records
   ```typescript
   export interface IScheduleFetcherUseCase {
       getScheduled(targetId: string): Promise<IScheduleRecord | null>;
       listScheduled(params: ISchedulerListParams): Promise<ISchedulerListResponse>;
   }
   export const ScheduleFetcher = createAbstraction<IScheduleFetcherUseCase>("ScheduleFetcher");
   ```

3. **ScheduleExecutor** - Abstraction for executing schedules
   ```typescript
   export interface IScheduleExecutorUseCase {
       schedule(targetId: string, input: ISchedulerInput): Promise<IScheduleRecord>;
       cancel(id: string): Promise<IScheduleRecord>;
   }
   export const ScheduleExecutor = createAbstraction<IScheduleExecutorUseCase>("ScheduleExecutor");
   ```

4. **Individual Use Cases** - One responsibility per use case

   **ScheduleRecord** - Create or update a schedule
   ```typescript
   export interface IScheduleRecordUseCase {
       execute(targetModel: CmsModel, targetId: string, input: ISchedulerInput): Promise<IScheduleRecord>;
   }
   export const ScheduleRecordUseCase = createAbstraction<IScheduleRecordUseCase>("ScheduleRecordUseCase");
   ```

   **CancelScheduledRecord** - Cancel an existing schedule
   ```typescript
   export interface ICancelScheduledRecordUseCase {
       execute(targetModel: CmsModel, id: string): Promise<IScheduleRecord>;
   }
   export const CancelScheduledRecordUseCase = createAbstraction<ICancelScheduledRecordUseCase>("CancelScheduledRecordUseCase");
   ```

   **GetScheduledRecord** - Get a single schedule
   ```typescript
   export interface IGetScheduledRecordUseCase {
       execute(targetModel: CmsModel, id: string): Promise<IScheduleRecord | null>;
   }
   export const GetScheduledRecordUseCase = createAbstraction<IGetScheduledRecordUseCase>("GetScheduledRecordUseCase");
   ```

   **ListScheduledRecords** - List schedules with filtering
   ```typescript
   export interface IListScheduledRecordsUseCase {
       execute(targetModel: CmsModel, params: ISchedulerListParams): Promise<ISchedulerListResponse>;
   }
   export const ListScheduledRecordsUseCase = createAbstraction<IListScheduledRecordsUseCase>("ListScheduledRecordsUseCase");
   ```

   **Note**: `targetModel` is passed as a method parameter, not injected via constructor. This is because the model varies per request while dependencies (executor, fetcher) remain constant.

5. **SchedulerService** - AWS EventBridge abstraction (from service layer)
   ```typescript
   export const SchedulerService = createAbstraction<ISchedulerService>("SchedulerService");
   ```


### Phase 2: Refactor Actions to Use DI

**Files**:
- `features/Scheduler/actions/PublishScheduleAction.ts`
- `features/Scheduler/actions/UnpublishScheduleAction.ts`

**Current Dependencies** (manually injected):
- `service: ISchedulerService`
- `cms: PublishScheduleActionCms`
- `targetModel: CmsModel` ← Now passed as method parameter
- `schedulerModel: CmsModel` ← Injected as instance
- `getIdentity: () => CmsIdentity` ← Injected as factory
- `fetcher: IScheduleFetcher`

**Proposed Approach**:

```typescript
class PublishScheduleActionImpl implements ScheduleAction.Interface {
    constructor(
        private eventBridgeService: EventBridgeSchedulerService.Interface,
        private schedulerModel: CmsModel, // Registered as instance
        private getIdentity: () => CmsIdentity, // Registered as factory
        // TODO: Create CMS use case abstractions for:
        // - GetEntryByIdUseCase
        // - PublishEntryUseCase
        // - CreateEntryUseCase
        // - UpdateEntryUseCase
        // - DeleteEntryUseCase
    ) {}

    canHandle(input: ISchedulerInput): boolean {
        return input.type === ScheduleType.publish;
    }

    async schedule(targetModel: CmsModel, params: IScheduleActionScheduleParams): Promise<IScheduleRecord> {
        // targetModel passed as parameter
        const { targetId, input, scheduleRecordId } = params;

        // TODO: Use GetEntryByIdUseCase with targetModel
        const targetEntry = await this.getEntryById.execute(targetModel, targetId);

        // ... rest of implementation
    }

    // reschedule and cancel also receive targetModel as parameter
}

export const PublishScheduleAction = ScheduleAction.createImplementation({
    implementation: PublishScheduleActionImpl,
    dependencies: [
        EventBridgeSchedulerService,
        SchedulerModel, // Instance
        IdentityProvider, // Factory
        // TODO: Add CMS use case abstractions
    ]
});
```

**Key Change**: `targetModel` is now a method parameter, not a constructor dependency.

### Phase 3: Create Use Case Implementations

#### 3.1 ScheduleFetcherUseCase

**File**: `features/Scheduler/ScheduleFetcherUseCase.ts`

**Current Dependencies**:
- `cms: Pick<HeadlessCms, "getEntryById" | "listLatestEntries">`
- `targetModel: CmsModel` ← Now passed as method parameter
- `schedulerModel: CmsModel` ← Injected as instance

**Proposed**:
```typescript
class ScheduleFetcherUseCaseImpl implements ScheduleFetcher.Interface {
    constructor(
        private schedulerModel: CmsModel, // Registered as instance
        // TODO: Create abstractions for:
        // - GetEntryByIdUseCase
        // - ListLatestEntriesUseCase
    ) {}

    async getScheduled(targetModel: CmsModel, targetId: string): Promise<IScheduleRecord | null> {
        const scheduleRecordId = createScheduleRecordIdWithVersion(targetId);

        // TODO: Use GetEntryByIdUseCase
        const entry = await this.getEntryById.execute(this.schedulerModel, scheduleRecordId);

        // Filter by targetModel
        if (entry.values.targetModelId !== targetModel.modelId) {
            return null;
        }

        return transformScheduleEntry(targetModel, entry);
    }

    async listScheduled(targetModel: CmsModel, params: ISchedulerListParams): Promise<ISchedulerListResponse> {
        // TODO: Use ListLatestEntriesUseCase
        const [data, meta] = await this.listLatestEntries.execute(this.schedulerModel, {
            ...params,
            where: {
                ...params.where,
                targetModelId: targetModel.modelId
            }
        });

        return {
            data: data.map(item => transformScheduleEntry(targetModel, item)),
            meta
        };
    }
}

export const ScheduleFetcherUseCase = ScheduleFetcher.createImplementation({
    implementation: ScheduleFetcherUseCaseImpl,
    dependencies: [
        SchedulerModel, // Instance
        // TODO: Add CMS use case abstractions
    ]
});
```

**Note**: `targetModel` is passed as method parameter, `schedulerModel` is injected once.

#### 3.2 ScheduleExecutorUseCase

**File**: `features/Scheduler/ScheduleExecutorUseCase.ts`

**Current Dependencies**:
- `actions: IScheduleAction[]`
- `fetcher: IScheduleFetcher`

**Proposed**:
```typescript
class ScheduleExecutorUseCaseImpl implements ScheduleExecutor.Interface {
    constructor(
        private actions: ScheduleAction.Interface[],
        private fetcher: ScheduleFetcher.Interface
    ) {}

    async schedule(targetModel: CmsModel, targetId: string, input: ISchedulerInput): Promise<IScheduleRecord> {
        const scheduleRecordId = createScheduleRecordIdWithVersion(targetId);

        // Pass targetModel to fetcher
        const original = await this.fetcher.getScheduled(targetModel, targetId);

        const action = this.getAction(input.type);

        if (original) {
            // Pass targetModel to action
            return action.reschedule(targetModel, original, input);
        }

        // Pass targetModel to action
        return action.schedule(targetModel, {
            scheduleRecordId,
            targetId,
            input
        });
    }

    async cancel(targetModel: CmsModel, initialId: string): Promise<IScheduleRecord> {
        const id = createScheduleRecordIdWithVersion(initialId);

        // Pass targetModel to fetcher
        const original = await this.fetcher.getScheduled(targetModel, id);

        if (!original) {
            throw new WebinyError(`No scheduled record found for ID "${id}".`, "SCHEDULED_RECORD_NOT_FOUND");
        }

        const action = this.getAction(original.type);

        // Pass targetModel to action
        await action.cancel(targetModel, original.id);

        return original;
    }

    private getAction(type: ScheduleType): ScheduleAction.Interface {
        const action = this.actions.find(action => action.canHandle({ type }));
        if (!action) {
            throw new WebinyError(`No action found for input type "${type}".`, "NO_ACTION_FOUND");
        }
        return action;
    }
}

export const ScheduleExecutorUseCase = ScheduleExecutor.createImplementation({
    implementation: ScheduleExecutorUseCaseImpl,
    dependencies: [
        [ScheduleAction, { multiple: true }],
        ScheduleFetcher
    ]
});
```

**Key Change**: Executor receives `targetModel` and passes it down to fetcher and actions.

#### 3.3 Individual Use Case Implementations

**ScheduleRecordUseCase** - Delegates to ScheduleExecutor
```typescript
class ScheduleRecordUseCaseImpl implements ScheduleRecordUseCase.Interface {
    constructor(private executor: ScheduleExecutor.Interface) {}

    async execute(targetModel: CmsModel, targetId: string, input: ISchedulerInput): Promise<IScheduleRecord> {
        return this.executor.schedule(targetModel, targetId, input);
    }
}

export const ScheduleRecordUseCaseImplementation = ScheduleRecordUseCase.createImplementation({
    implementation: ScheduleRecordUseCaseImpl,
    dependencies: [ScheduleExecutor]
});
```

**CancelScheduledRecordUseCase** - Delegates to ScheduleExecutor
```typescript
class CancelScheduledRecordUseCaseImpl implements CancelScheduledRecordUseCase.Interface {
    constructor(private executor: ScheduleExecutor.Interface) {}

    async execute(targetModel: CmsModel, id: string): Promise<IScheduleRecord> {
        return this.executor.cancel(targetModel, id);
    }
}

export const CancelScheduledRecordUseCaseImplementation = CancelScheduledRecordUseCase.createImplementation({
    implementation: CancelScheduledRecordUseCaseImpl,
    dependencies: [ScheduleExecutor]
});
```

**GetScheduledRecordUseCase** - Delegates to ScheduleFetcher
```typescript
class GetScheduledRecordUseCaseImpl implements GetScheduledRecordUseCase.Interface {
    constructor(private fetcher: ScheduleFetcher.Interface) {}

    async execute(targetModel: CmsModel, id: string): Promise<IScheduleRecord | null> {
        return this.fetcher.getScheduled(targetModel, id);
    }
}

export const GetScheduledRecordUseCaseImplementation = GetScheduledRecordUseCase.createImplementation({
    implementation: GetScheduledRecordUseCaseImpl,
    dependencies: [ScheduleFetcher]
});
```

**ListScheduledRecordsUseCase** - Delegates to ScheduleFetcher
```typescript
class ListScheduledRecordsUseCaseImpl implements ListScheduledRecordsUseCase.Interface {
    constructor(private fetcher: ScheduleFetcher.Interface) {}

    async execute(targetModel: CmsModel, params: ISchedulerListParams): Promise<ISchedulerListResponse> {
        return this.fetcher.listScheduled(targetModel, params);
    }
}

export const ListScheduledRecordsUseCaseImplementation = ListScheduledRecordsUseCase.createImplementation({
    implementation: ListScheduledRecordsUseCaseImpl,
    dependencies: [ScheduleFetcher]
});
```

**Key Change**: All use cases pass `targetModel` through to their dependencies.


### Phase 4: Add Model Validation Decorator

**File**: `features/Scheduler/ValidateNotPrivateModelDecorator.ts`

**Purpose**: Validate that `targetModel` is not private before executing any schedule operation.

```typescript
class ValidateNotPrivateModelDecorator implements ScheduleRecordUseCase.Interface {
    constructor(private decoratee: ScheduleRecordUseCase.Interface) {}

    async execute(targetModel: CmsModel, targetId: string, input: ISchedulerInput): Promise<IScheduleRecord> {
        if (targetModel.isPrivate) {
            throw new WebinyError(
                "Cannot schedule operations on private models.",
                "PRIVATE_MODEL_ERROR",
                { modelId: targetModel.modelId }
            );
        }

        return this.decoratee.execute(targetModel, targetId, input);
    }
}

export const ValidateNotPrivateModel = ScheduleRecordUseCase.createDecorator({
    decorator: ValidateNotPrivateModelDecorator,
    dependencies: []
});
```

**Registration**:
```typescript
// In feature.ts
container.registerDecorator(ValidateNotPrivateModel);
```

**Note**: This decorator only needs to be registered for command use cases (ScheduleRecordUseCase, CancelScheduledRecordUseCase). Query use cases (Get, List) don't need validation since they're read-only.

### Phase 5: Create Feature Registration

**File**: `features/Scheduler/feature.ts`

```typescript
export const SchedulerFeature = createFeature({
    name: "Scheduler",
    register(container) {
        // Register AWS EventBridge service layer
        // TODO: SchedulerService needs to be refactored to use abstraction
        // container.register(EventBridgeSchedulerServiceImpl).inSingletonScope();

        // Register infrastructure components
        container.register(ScheduleFetcherUseCase);
        container.register(ScheduleExecutorUseCase);

        // Register individual use cases
        container.register(ScheduleRecordUseCaseImplementation);
        container.register(CancelScheduledRecordUseCaseImplementation);
        container.register(GetScheduledRecordUseCaseImplementation);
        container.register(ListScheduledRecordsUseCaseImplementation);

        // Register action implementations
        container.register(PublishScheduleAction);
        container.register(UnpublishScheduleAction);

        // Register validation decorator for commands
        container.registerDecorator(ValidateNotPrivateModel);
    }
});
```

### Phase 6: Refactor SchedulerService

**File**: `features/Scheduler/SchedulerServiceImpl.ts`

**Current State**: Class with constructor injection of client and config

**Proposed**:
```typescript
class SchedulerServiceImpl implements SchedulerService.Interface {
    constructor(
        private getClient: (config?: SchedulerClientConfig) => Pick<SchedulerClient, "send">,
        private config: ISchedulerServiceConfig
    ) {}

    // ... existing methods
}

export const SchedulerServiceImplementation = SchedulerService.createImplementation({
    implementation: SchedulerServiceImpl,
    dependencies: [
        // TODO: How to inject AWS client factory?
        // TODO: How to inject config (from manifest)?
    ]
});
```

**Challenge**: `getClient` and `config` come from external sources (manifest, AWS SDK).

**Solution**: Register as instances in context setup:
```typescript
// In context.ts after loading manifest
container.registerInstance(SchedulerServiceConfig, {
    lambdaArn: manifest.scheduler.lambdaArn,
    roleArn: manifest.scheduler.roleArn
});
container.registerFactory(SchedulerServiceClientFactory, () => getClient);
```

### Phase 7: Update Context Integration

**File**: `src/context.ts`

**Current State**:
```typescript
const scheduler = await createScheduler({
    security,
    cms,
    service: schedulerService,
    schedulerModel
});
context.cms.scheduler = scheduler;
```

**Proposed**:
```typescript
// Register feature
SchedulerFeature.register(context.container);

// Register manifest-based instances
container.registerInstance(SchedulerServiceConfig, manifestConfig);
container.registerInstance(SchedulerModel, schedulerModel);

// Register identity provider as factory
container.registerFactory(IdentityProvider, () => security.getIdentity());

// No context.cms.scheduler - GraphQL resolvers use container directly
```

**Note**: We're removing `context.cms.scheduler` entirely. GraphQL resolvers will resolve use cases from `context.container`.

### Phase 8: Update GraphQL Resolvers

**File**: `src/graphql/index.ts`

**Before (with context.cms.scheduler)**:
```typescript
const createCmsSchedule = async (_, args, context) => {
    const model = await context.cms.getModel(args.modelId);
    const scheduler = context.cms.scheduler(model);
    return scheduler.schedule(args.id, args.input);
};
```

**After (with container)**:
```typescript
const createCmsSchedule = async (_, args, context) => {
    // Get model
    const model = await context.cms.getModel(args.modelId);

    // Resolve use case from container
    const scheduleUseCase = context.container.resolve(ScheduleRecordUseCase);

    // Execute with targetModel as parameter
    const result = await scheduleUseCase.execute(model, args.id, args.input);

    return result;
};

const getCmsSchedule = async (_, args, context) => {
    const model = await context.cms.getModel(args.modelId);
    const getUseCase = context.container.resolve(GetScheduledRecordUseCase);
    return getUseCase.execute(model, args.id);
};

const listCmsSchedules = async (_, args, context) => {
    const model = await context.cms.getModel(args.modelId);
    const listUseCase = context.container.resolve(ListScheduledRecordsUseCase);
    return listUseCase.execute(model, args);
};

const cancelCmsSchedule = async (_, args, context) => {
    const model = await context.cms.getModel(args.modelId);
    const cancelUseCase = context.container.resolve(CancelScheduledRecordUseCase);
    return cancelUseCase.execute(model, args.id);
};
```

**Pattern**:
1. Get model from args
2. Resolve specific use case from container
3. Execute with model as first parameter

## Dependency Chain Analysis

### Before (Manual Instantiation)
```
createScheduler (factory)
  ├─ new ScheduleFetcher({ cms, targetModel, schedulerModel })
  ├─ new PublishScheduleAction({
  │    cms,
  │    schedulerModel,
  │    targetModel,
  │    service,
  │    getIdentity,
  │    fetcher
  │  })
  ├─ new UnpublishScheduleAction({ ... same ... })
  ├─ new ScheduleExecutor({ actions, fetcher })
  └─ new Scheduler({ fetcher, executor })
```

### After (DI Container with Method Parameters)
```
GraphQL Resolver
  ├─ Get targetModel from args
  └─ Container.resolve(ScheduleRecordUseCase)
       │
       ├─ Inject: ScheduleExecutor
       │    ├─ Inject: [ScheduleAction] (multiple)
       │    │    │
       │    │    ├─ PublishScheduleAction
       │    │    │    ├─ Inject: EventBridgeSchedulerService
       │    │    │    ├─ Inject: SchedulerModel (instance)
       │    │    │    ├─ Inject: IdentityProvider (factory)
       │    │    │    └─ Inject: CMS Use Cases (TODO)
       │    │    │
       │    │    └─ UnpublishScheduleAction
       │    │         ├─ Inject: EventBridgeSchedulerService
       │    │         ├─ Inject: SchedulerModel (instance)
       │    │         ├─ Inject: IdentityProvider (factory)
       │    │         └─ Inject: CMS Use Cases (TODO)
       │    │
       │    └─ Inject: ScheduleFetcher
       │         ├─ Inject: SchedulerModel (instance)
       │         └─ Inject: CMS Use Cases (TODO)
       │
       └─ Wrapped by: ValidateNotPrivateModelDecorator
            └─ Validates targetModel.isPrivate

  → Execute: useCase.execute(targetModel, id, input)
       │
       └─ targetModel passed as parameter through:
            ScheduleRecordUseCase
              → ScheduleExecutor.schedule(targetModel, ...)
                  → ScheduleAction.schedule(targetModel, ...)
                      → EventBridgeSchedulerService
                  → ScheduleFetcher.getScheduled(targetModel, ...)
```

**Key Differences**:
- No child containers needed
- `targetModel` passed as method parameter
- `schedulerModel` injected once as instance
- All use cases registered once in parent container
- Validation transparent via decorator

## Benefits of Proposed Architecture

1. **Single Responsibility**: Each use case has one clear responsibility
   - `ScheduleRecordUseCase` - Only schedules records
   - `CancelScheduledRecordUseCase` - Only cancels schedules
   - `GetScheduledRecordUseCase` - Only retrieves single schedule
   - `ListScheduledRecordsUseCase` - Only lists schedules

2. **Testability**: Easy to mock dependencies via container
   - Test each use case in isolation
   - Mock only what each use case needs

3. **Extensibility**: New schedule types = new action registration
   - Add new actions without modifying use cases
   - Actions are discovered via DI container

4. **Consistency**: Matches ProcessRecords feature pattern
   - Same DI patterns throughout codebase
   - Same abstraction/implementation split

5. **Separation of Concerns**: Clear abstraction boundaries
   - Use cases don't know about AWS EventBridge
   - Actions don't know about each other
   - Service object is just a facade

6. **Type Safety**: TypeScript enforces dependency contracts
   - Container validates dependencies at registration
   - Compile-time checking of dependency types

7. **Maintainability**: Dependencies declared explicitly
   - Easy to see what each component needs
   - Refactoring dependencies is straightforward

8. **Reusability**: Components can be reused in different contexts
   - Use cases can be composed differently
   - Actions can be used outside scheduler context

9. **No God Objects**: No convenience wrappers that grow over time
   - Each use case is resolved individually
   - GraphQL resolvers explicitly choose which use case to call
   - Prevents accidental dependencies between operations

## Challenges and Solutions

### Challenge 1: Model-Specific Context
**Problem**: Scheduler needs model context (targetModel varies per request, schedulerModel is constant)

**Solution**: Pass `targetModel` as method parameter, inject `schedulerModel` as instance
- `targetModel` → method parameter (varies per request)
- `schedulerModel` → registered as instance (constant)

### Challenge 2: CMS Use Cases Not Abstracted
**Problem**: Actions depend on CMS methods like `getEntryById`, `publishEntry`, etc.

**Solution**:
- **Short-term**: Leave as TODOs in dependencies, inject CMS context
- **Long-term**: Create proper use case abstractions for all CMS operations

### Challenge 3: External Dependencies (AWS Client, Manifest Config)
**Problem**: EventBridgeSchedulerService depends on AWS client factory and manifest config

**Solution**: Register as instances during context setup:
```typescript
container.registerInstance(SchedulerServiceConfig, manifestConfig);
container.registerFactory(SchedulerServiceClientFactory, clientFactory);
```

### Challenge 4: Identity Provider
**Problem**: Actions need current user identity (runtime value)

**Solution**: Register identity factory in parent container:
```typescript
container.registerFactory(IdentityProvider, () => security.getIdentity());
```

### Challenge 5: Model Validation
**Problem**: Need to validate `targetModel.isPrivate` before operations

**Solution**: Use decorator pattern (transparent to consumers):
```typescript
container.registerDecorator(ValidateNotPrivateModel);
```

### Challenge 6: Context God Object
**Problem**: Don't want to add `context.cms.scheduler`

**Solution**: GraphQL resolvers resolve use cases directly from `context.container`

## Migration Sequence

### Step 1: Create Abstractions (No Breaking Changes)
- Create `features/Scheduler/abstractions.ts`
- Define all abstractions
- No existing code changes

### Step 2: Refactor SchedulerService (Independent)
- Create SchedulerService abstraction and implementation
- Register in feature
- Test independently

### Step 3: Refactor ScheduleFetcher (Minimal Dependencies)
- Create ScheduleFetcherUseCase
- Leave CMS dependencies as TODOs
- Register in feature

### Step 4: Refactor Actions (Complex Dependencies)
- Create PublishScheduleAction with DI
- Create UnpublishScheduleAction with DI
- Leave CMS use cases as TODOs
- Register in feature

### Step 5: Refactor ScheduleExecutor (Uses Actions + Fetcher)
- Create ScheduleExecutorUseCase
- Inject actions and fetcher
- Register in feature

### Step 6: Refactor Scheduler (Uses Executor + Fetcher)
- Create SchedulerUseCase
- Inject executor and fetcher
- Register in feature

### Step 7: Create Factory (Uses Container)
- Create SchedulerFactory
- Implement child container pattern
- Register in feature

### Step 8: Update Context Integration
- Update `context.ts` to use factory
- Remove old `createScheduler` factory
- Test end-to-end

### Step 9: Clean Up
- Remove old files from `scheduler/` directory
- Update imports throughout codebase
- Update tests

## Testing Strategy

### Unit Tests
- Test each use case in isolation with mocked dependencies
- Test actions with mocked services
- Test factory with mocked container

### Integration Tests
- Test scheduler creation flow
- Test schedule/cancel operations end-to-end
- Test with real AWS EventBridge (optional)

### Migration Tests
- Ensure behavior identical before/after migration
- Test all schedule types (publish, unpublish, immediate, past date, future date)
- Test error scenarios

## Rollback Plan

If migration causes issues:

1. **Keep old code**: Don't delete old files until migration complete
2. **Feature flag**: Use environment variable to toggle old/new implementation
3. **Gradual rollout**: Test in dev → staging → production

## Timeline Estimate

- **Phase 1** (Abstractions): 2-3 hours
- **Phase 2** (Actions refactor): 4-6 hours
- **Phase 3** (Use cases): 3-4 hours
- **Phase 4** (Factory): 3-4 hours
- **Phase 5** (Feature registration): 1-2 hours
- **Phase 6** (SchedulerService): 2-3 hours
- **Phase 7** (Context integration): 2-3 hours
- **Testing**: 4-6 hours

**Total**: ~20-30 hours

## Open Questions

1. **CMS Use Case Abstractions**: Should we create them now or leave as TODOs?
   - **Recommendation**: Leave as TODOs, create separately when migrating CMS core

2. **targetModel Parameter**: Should it be first or last parameter in execute() methods?
   - **Recommendation**: First parameter - it's the primary context

3. **Identity Management**: Should identity be injected or fetched on-demand?
   - **Recommendation**: Register factory in parent container for on-demand access

4. **EventBridge Service Layer**: Should SchedulerService stay in `service/` or move to `features/`?
   - **Recommendation**: Move to `features/Scheduler/` and rename to `EventBridgeSchedulerService` for clarity

5. **GraphQL Resolver Pattern**: Resolve use case every request or cache?
   - **Recommendation**: Resolve every request - containers are fast and we avoid memory leaks

6. **Validation Decorator Scope**: Apply to all use cases or just commands?
   - **Recommendation**: Just commands (Schedule, Cancel) - queries don't mutate so don't need validation

## Success Criteria

- ✅ All scheduler operations work identically to before
- ✅ No manual instantiation (everything via DI container)
- ✅ All dependencies injected via DI container
- ✅ Tests pass with mocked dependencies
- ✅ New schedule types can be added via registration only
- ✅ Code follows same patterns as ProcessRecords feature
- ✅ Each use case has single responsibility with one `execute()` method
- ✅ No convenience wrapper/god objects
- ✅ No factory pattern needed
- ✅ No child containers needed
- ✅ GraphQL resolvers explicitly resolve individual use cases from `context.container`
- ✅ No `context.cms.scheduler` - avoiding god object pattern
- ✅ `targetModel` passed as method parameter
- ✅ Validation transparent via decorator

## Future Enhancements

After migration:

1. **CMS Use Case Abstractions**: Create proper abstractions for all CMS operations
2. **Event Publishing**: Add domain events (ScheduleCreated, ScheduleCanceled, etc.)
3. **Error Handling**: Use Result pattern instead of throwing exceptions
4. **Validation**: Move validation to dedicated use cases/validators
5. **Decorators**: Add decorators for access control, logging, etc.
6. **Composite Actions**: Support complex schedule types with composite pattern

## References

- ProcessRecords feature implementation: `src/features/ProcessRecords/`
- DI Container documentation: `ai-context/di-container.md`
- Backend Developer Guide: `ai-context/backend-developer-guide.md`
- Current architecture: `ARCHITECTURE.md`
