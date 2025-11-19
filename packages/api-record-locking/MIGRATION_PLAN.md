# Migration Plan: api-record-locking → Feature-Based Architecture

## Current Architecture Issues

1. **`getManager()` pattern**: Uses async function that returns entry manager - should inject use cases directly
2. **No abstractions**: Use cases created imperatively without DI abstractions
3. **No events**: Uses pubsub topics instead of EventPublisher pattern
4. **Direct CMS dependencies**: Directly calls `context.cms.getModel()` and `context.cms.getEntryManager()`
5. **Mixed concerns**: CRUD factory mixes setup logic with business logic

## Migration Strategy

### Phase 1: Create Feature Structure

```
packages/api-record-locking/src/features/
├── shared/
│   ├── abstractions.ts          # Shared types, domain model interfaces
│   ├── errors.ts                # Domain errors
│   └── LockRecord.ts            # Domain model
├── LockEntry/
│   ├── abstractions.ts
│   ├── events.ts
│   ├── LockEntryUseCase.ts
│   ├── LockEntryRepository.ts   # Repository for this use case only
│   ├── feature.ts
│   └── types.ts
├── UnlockEntry/
│   ├── abstractions.ts
│   ├── events.ts
│   ├── UnlockEntryUseCase.ts
│   ├── UnlockEntryRepository.ts # Repository for this use case only
│   ├── feature.ts
│   └── types.ts
├── GetLockRecord/
│   ├── abstractions.ts
│   ├── GetLockRecordUseCase.ts
│   ├── GetLockRecordRepository.ts # Repository for this use case only
│   └── feature.ts
├── ListLockRecords/
│   ├── abstractions.ts
│   ├── ListLockRecordsUseCase.ts
│   ├── ListLockRecordsRepository.ts # Repository for this use case only
│   └── feature.ts
├── UpdateEntryLock/
│   ├── abstractions.ts
│   ├── UpdateEntryLockUseCase.ts
│   ├── UpdateEntryLockRepository.ts # Repository for this use case only
│   └── feature.ts
└── RecordLockingManagement/
    └── feature.ts               # Composite feature
```

### Phase 2: Replace `getManager()` with Proper Dependencies

**Current Pattern (Bad):**

```typescript
getManager(): Promise<IRecordLockingModelManager>
```

**New Pattern (Good):**

```typescript
// Inject proper use cases from cms package
constructor(
  private getEntryById: GetEntryByIdUseCase.Interface,
  private createEntry: CreateEntryUseCase.Interface,
  private deleteEntry: DeleteEntryUseCase.Interface,
  private getModel: GetModelUseCase.Interface
)
```

### Phase 3: Convert PubSub Topics to EventPublisher

**Current (Bad):**

```typescript
const onEntryBeforeLock = createTopic<OnEntryBeforeLockTopicParams>();
const onEntryAfterLock = createTopic<OnEntryAfterLockTopicParams>();
await onEntryBeforeLock.publish(params);
```

**New (Good):**

```typescript
// events.ts
export class EntryBeforeLockEvent extends DomainEvent<EntryBeforeLockPayload> {
  eventType = "RecordLocking/Entry/BeforeLock" as const;
  getHandlerAbstraction() { return EntryBeforeLockHandler; }
}

export const EntryBeforeLockHandler =
  createAbstraction<IEventHandler<EntryBeforeLockEvent>>("EntryBeforeLockHandler");

export namespace EntryBeforeLockHandler {
  export type Interface = IEventHandler<EntryBeforeLockEvent>;
  export type Event = EntryBeforeLockEvent;
}

// UseCase
await this.eventPublisher.publish(new EntryBeforeLockEvent({ id, type }));
```

### Phase 4: Use Existing Abstractions for Dependencies

**Import IdentityContext (replaces SecurityGateway):**

```typescript
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";

// In use case constructor
constructor(
  private identityContext: IdentityContext.Interface,
  // ... other dependencies
) {}

// Usage in use case
const identity = await this.identityContext.getIdentity();
```

**Import WebsocketsContext:**

```typescript
import { WebsocketsContext } from "@webiny/api-websockets/features/WebsocketsContext";

// In use case constructor
constructor(
  private websocketsContext: WebsocketsContext.Interface,
  // ... other dependencies
) {}

// Usage in use case
await this.websocketsContext.send(identity, data);
```

**Note:** These abstractions are already registered in their respective packages, so no manual registration needed.

### Phase 5: Domain Errors

**Create domain-specific errors:**

```typescript
// shared/errors.ts
import { BaseError } from "@webiny/feature/api";

export class EntryAlreadyLockedError extends BaseError {
  override readonly code = "RecordLocking/EntryAlreadyLockedError" as const;

  constructor(data: { id: string; type: string }) {
    super({
      message: "Entry is already locked for editing.",
      data
    });
  }
}

export class LockRecordNotFoundError extends BaseError {
  override readonly code = "RecordLocking/LockRecordNotFoundError" as const;

  constructor(data: { id: string }) {
    super({
      message: "Lock Record not found.",
      data
    });
  }
}

export class LockRecordPersistenceError extends BaseError {
  override readonly code = "RecordLocking/LockRecordPersistenceError" as const;

  constructor(error: Error) {
    super({
      message: error.message,
      data: {}
    });
  }
}

export class NotSameIdentityError extends BaseError {
  override readonly code = "RecordLocking/NotSameIdentityError" as const;

  constructor(data: { currentId: string; targetId: string }) {
    super({
      message: "Identity mismatch - cannot perform action.",
      data
    });
  }
}

export class UnlockEntryError extends BaseError {
  override readonly code = "RecordLocking/UnlockEntryError" as const;

  constructor(error: Error) {
    super({
      message: `Could not unlock entry: ${error.message}`,
      data: {}
    });
  }
}

export class LockEntryError extends BaseError {
  override readonly code = "RecordLocking/LockEntryError" as const;

  constructor(error: Error) {
    super({
      message: `Could not lock entry: ${error.message}`,
      data: {}
    });
  }
}
```

### Phase 6: Key Use Cases to Migrate

#### 1. LockEntry - Lock an entry for editing

**Dependencies:**
- `LockEntryRepository` - Internal repository (injected into use case)
- `IsEntryLockedUseCase` - Internal use case
- `EventPublisher` - From `@webiny/api-core/features/EventPublisher`
- `IdentityContext` - From `@webiny/api-core/features/IdentityContext`

**Repository Dependencies (LockEntryRepository):**
- `GetEntryByIdUseCase` - From `@webiny/api-headless-cms/features/contentEntry/GetEntryById`
- `CreateEntryUseCase` - From `@webiny/api-headless-cms/features/contentEntry/CreateEntry`

**Events:**
- `EntryBeforeLockEvent`
- `EntryAfterLockEvent`
- `EntryLockErrorEvent`

**Errors:**
- `EntryAlreadyLockedError`
- `LockEntryError`

#### 2. UnlockEntry - Unlock an entry

**Dependencies:**
- `UnlockEntryRepository` - Internal repository (injected into use case)
- `GetLockRecordUseCase` - Internal use case
- `KickOutCurrentUserUseCase` - Internal use case
- `EventPublisher` - From `@webiny/api-core/features/EventPublisher`
- `IdentityContext` - From `@webiny/api-core/features/IdentityContext`
- `WebsocketsContext` - From `@webiny/api-websockets/features/WebsocketsContext`

**Repository Dependencies (UnlockEntryRepository):**
- `DeleteEntryUseCase` - From `@webiny/api-headless-cms/features/contentEntry/DeleteEntry`

**Events:**
- `EntryBeforeUnlockEvent`
- `EntryAfterUnlockEvent`
- `EntryUnlockErrorEvent`

**Errors:**
- `LockRecordNotFoundError`
- `NotSameIdentityError`
- `UnlockEntryError`

#### 3. GetLockRecord - Get lock record for entry

**Dependencies:**
- `GetLockRecordRepository` - Internal repository (injected into use case)

**Repository Dependencies (GetLockRecordRepository):**
- `GetEntryByIdUseCase` - From `@webiny/api-headless-cms/features/contentEntry/GetEntryById`

**Errors:**
- `LockRecordNotFoundError`

#### 4. ListLockRecords - List all lock records

**Dependencies:**
- `ListLockRecordsRepository` - Internal repository (injected into use case)

**Repository Dependencies (ListLockRecordsRepository):**
- `ListEntriesUseCase` - From `@webiny/api-headless-cms/features/contentEntry/ListEntries`

**Errors:**
- `LockRecordPersistenceError`

#### 5. UpdateEntryLock - Update lock timestamp

**Dependencies:**
- `UpdateEntryLockRepository` - Internal repository (injected into use case)
- `GetLockRecordUseCase` - Internal use case

**Repository Dependencies (UpdateEntryLockRepository):**
- `UpdateEntryUseCase` - From `@webiny/api-headless-cms/features/contentEntry/UpdateEntry`

**Errors:**
- `LockRecordNotFoundError`
- `LockRecordPersistenceError`

#### 6. IsEntryLocked - Check if entry is locked

**Dependencies:**
- `GetLockRecordUseCase` - Internal use case

**Returns:** `boolean`

### Phase 7: Repository Pattern - One Repository Per Use Case

**Example: LockEntryRepository**

```typescript
// features/LockEntry/LockEntryRepository.ts
import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { LockEntryRepository as RepositoryAbstraction } from "./abstractions.js";
import type { LockRecord } from "../shared/LockRecord.js";

class LockEntryRepositoryImpl implements RepositoryAbstraction.Interface {
  constructor(
    private createEntry: CreateEntryUseCase.Interface
  ) {}

  async createLockRecord(record: LockRecord): Promise<Result<LockRecord, RepositoryAbstraction.Error>> {
    // Implementation using createEntry
  }
}

export const LockEntryRepositoryImpl = RepositoryAbstraction.createImplementation({
  implementation: LockEntryRepositoryImpl,
  dependencies: [CreateEntryUseCase]
});

// In feature registration
container.register(LockEntryRepositoryImpl).inSingletonScope();
```

**Example: GetLockRecordRepository**

```typescript
// features/GetLockRecord/GetLockRecordRepository.ts
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { GetLockRecordRepository as RepositoryAbstraction } from "./abstractions.js";

class GetLockRecordRepositoryImpl implements RepositoryAbstraction.Interface {
  constructor(
    private getEntryById: GetEntryByIdUseCase.Interface
  ) {}

  async getLockRecord(id: string): Promise<Result<LockRecord, RepositoryAbstraction.Error>> {
    // Implementation using getEntryById
  }
}

export const GetLockRecordRepositoryImpl = RepositoryAbstraction.createImplementation({
  implementation: GetLockRecordRepositoryImpl,
  dependencies: [GetEntryByIdUseCase]
});
```

**Example: ListLockRecordsRepository**

```typescript
// features/ListLockRecords/ListLockRecordsRepository.ts
import { ListEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { ListLockRecordsRepository as RepositoryAbstraction } from "./abstractions.js";

class ListLockRecordsRepositoryImpl implements RepositoryAbstraction.Interface {
  constructor(
    private listEntries: ListEntriesUseCase.Interface
  ) {}

  async listLockRecords(params: ListParams): Promise<Result<LockRecord[], RepositoryAbstraction.Error>> {
    // Implementation using listEntries
  }
}

export const ListLockRecordsRepositoryImpl = RepositoryAbstraction.createImplementation({
  implementation: ListLockRecordsRepositoryImpl,
  dependencies: [ListEntriesUseCase]
});
```

**Key Principle:** Each repository serves only the needs of its associated use case. No god objects or shared repositories.

### Phase 8: Feature Registration

**Main feature:**

```typescript
// features/RecordLockingManagement/feature.ts
import { createFeature } from "@webiny/feature";
import { Container } from "@webiny/di";
import { LockEntryFeature } from "../LockEntry/feature.js";
import { UnlockEntryFeature } from "../UnlockEntry/feature.js";
import { GetLockRecordFeature } from "../GetLockRecord/feature.js";
import { ListLockRecordsFeature } from "../ListLockRecords/feature.js";
import { UpdateEntryLockFeature } from "../UpdateEntryLock/feature.js";

export const RecordLockingManagementFeature = createFeature({
  name: "RecordLockingManagement",
  register(container: Container) {
    // Register sub-features (each registers its own repository in singleton scope)
    LockEntryFeature.register(container);
    UnlockEntryFeature.register(container);
    GetLockRecordFeature.register(container);
    ListLockRecordsFeature.register(container);
    UpdateEntryLockFeature.register(container);
  }
});
```

**Individual feature example:**

```typescript
// features/LockEntry/feature.ts
import { createFeature } from "@webiny/feature";
import { Container } from "@webiny/di";
import { LockEntryUseCaseImpl } from "./LockEntryUseCase.js";
import { LockEntryRepositoryImpl } from "./LockEntryRepository.js";

export const LockEntryFeature = createFeature({
  name: "LockEntry",
  register(container: Container) {
    // Register repository in singleton scope
    container.register(LockEntryRepositoryImpl).inSingletonScope();

    // Register use case in transient scope (default)
    container.register(LockEntryUseCaseImpl);
  }
});
```

## Dependencies from CMS Package

The following use cases will be injected from `@webiny/api-headless-cms`:

- `GetEntryByIdUseCase` (from `contentEntry/GetEntryById`)
- `CreateEntryUseCase` (from `contentEntry/CreateEntry`)
- `UpdateEntryUseCase` (from `contentEntry/UpdateEntry`)
- `DeleteEntryUseCase` (from `contentEntry/DeleteEntry`)
- `ListEntriesUseCase` (from `contentEntry/ListEntries`)
- `GetModelUseCase` (from `contentModel/GetModel`)

## Summary of Key Changes

1. ✅ **Remove `getManager()`** → Inject entry use cases directly
2. ✅ **Remove PubSub topics** → Use EventPublisher with domain events
3. ✅ **Create proper abstractions** for all use cases
4. ✅ **Create domain-specific errors** extending BaseError
5. ✅ **Register in correct scopes:**
   - Use cases: Transient scope (default)
   - Repositories: Singleton scope
   - Gateways: Singleton scope
6. ✅ **Use existing abstractions** from core packages:
   - `IdentityContext` from `@webiny/api-core/features/IdentityContext`
   - `WebsocketsContext` from `@webiny/api-websockets/features/WebsocketsContext`
7. ✅ **One repository per use case** - No god objects
8. ✅ **One file per class** rule
9. ✅ **Feature-based folder structure**

## Migration Checklist

### Shared Components
- [ ] Create `features/shared/` directory structure
- [ ] Create domain errors in `shared/errors.ts`
- [ ] Create `LockRecord` domain model in `shared/LockRecord.ts`

### LockEntry Feature
- [ ] Create `features/LockEntry/` directory
- [ ] Create abstractions (use case + repository)
- [ ] Create events (BeforeLock, AfterLock, LockError)
- [ ] Implement `LockEntryRepository` (uses CreateEntryUseCase)
- [ ] Implement `LockEntryUseCase`
- [ ] Create feature registration
- [ ] Register repository in singleton scope, use case in transient scope

### UnlockEntry Feature
- [ ] Create `features/UnlockEntry/` directory
- [ ] Create abstractions (use case + repository)
- [ ] Create events (BeforeUnlock, AfterUnlock, UnlockError)
- [ ] Implement `UnlockEntryRepository` (uses DeleteEntryUseCase)
- [ ] Implement `UnlockEntryUseCase`
- [ ] Create feature registration
- [ ] Register repository in singleton scope, use case in transient scope

### GetLockRecord Feature
- [ ] Create `features/GetLockRecord/` directory
- [ ] Create abstractions (use case + repository)
- [ ] Implement `GetLockRecordRepository` (uses GetEntryByIdUseCase)
- [ ] Implement `GetLockRecordUseCase`
- [ ] Create feature registration
- [ ] Register repository in singleton scope, use case in transient scope

### ListLockRecords Feature
- [ ] Create `features/ListLockRecords/` directory
- [ ] Create abstractions (use case + repository)
- [ ] Implement `ListLockRecordsRepository` (uses ListEntriesUseCase)
- [ ] Implement `ListLockRecordsUseCase`
- [ ] Create feature registration
- [ ] Register repository in singleton scope, use case in transient scope

### UpdateEntryLock Feature
- [ ] Create `features/UpdateEntryLock/` directory
- [ ] Create abstractions (use case + repository)
- [ ] Implement `UpdateEntryLockRepository` (uses UpdateEntryUseCase)
- [ ] Implement `UpdateEntryLockUseCase`
- [ ] Create feature registration
- [ ] Register repository in singleton scope, use case in transient scope

### IsEntryLocked Feature
- [ ] Create `features/IsEntryLocked/` directory
- [ ] Create abstractions (use case only)
- [ ] Implement `IsEntryLockedUseCase` (uses GetLockRecordUseCase)
- [ ] Create feature registration
- [ ] Register use case in transient scope

### KickOutCurrentUser Feature
- [ ] Create `features/KickOutCurrentUser/` directory
- [ ] Create abstractions (use case only)
- [ ] Implement `KickOutCurrentUserUseCase` (uses WebsocketsContext)
- [ ] Create feature registration
- [ ] Register use case in transient scope

### Composite Feature
- [ ] Create `RecordLockingManagement` feature that registers all sub-features

### Integration & Cleanup
- [ ] Update GraphQL schema to use new features
- [ ] Update `index.ts` to export features and abstractions
- [ ] Remove old `crud/` directory
- [ ] Remove old `useCases/` directory
- [ ] Update tests to use new feature structure
- [ ] Update documentation
