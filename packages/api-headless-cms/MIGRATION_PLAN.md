# API Headless CMS - Clean Architecture Migration Plan

## Executive Summary

This document outlines the migration plan for `@webiny/api-headless-cms` from its current CRUD-based architecture to a Clean Architecture with domain-driven design (DDD), following the patterns established in `@webiny/api-core`.

**Migration Goals:**
1. ✅ Break down monolithic CRUD files into domain-specific features
2. ✅ Implement proper use cases with dependency injection
3. ✅ Create unified repository pattern for DB + code-defined models
4. ✅ Establish domain events with proper event handlers
5. ✅ Maintain backward compatibility during migration
6. ⚠️ Keep model plugins in legacy format (out of scope for Phase 1)

---

## Current Architecture Analysis

### Package Structure (Before Migration)

```
packages/api-headless-cms/src/
├── crud/
│   ├── contentModel.crud.ts          # 800+ lines - Model CRUD
│   ├── contentModelGroup.crud.ts     # 400+ lines - Group CRUD
│   ├── contentEntry.crud.ts          # 1800+ lines - Entry CRUD orchestrator
│   └── contentEntry/
│       ├── useCases/                 # 47 use case files (already structured!)
│       ├── beforeCreate.ts           # Lifecycle hooks
│       ├── beforeUpdate.ts
│       └── entryDataFactories/       # Data transformation
├── types/
│   ├── types.ts                      # 2400+ lines of type definitions
│   ├── context.ts                    # Context interfaces
│   └── plugins.ts                    # Plugin types
├── plugins/
│   ├── CmsModelPlugin.ts             # Code-defined models
│   ├── CmsGroupPlugin.ts             # Code-defined groups
│   └── ...                           # Field type plugins
├── storage/                          # Storage transform plugins
├── utils/                            # Utilities and helpers
└── graphql/                          # GraphQL schema generation
```

### Identified Problems

1. **Monolithic CRUD files** - contentEntry.crud.ts is 1800+ lines
2. **Mixed responsibilities** - CRUD files handle orchestration, validation, events, transforms
3. **No domain boundaries** - Publishing, deletion, revisions all mixed together
4. **Dual model sources** - DB models and plugin models handled inconsistently
5. **Event system fragmentation** - Both pub/sub topics AND DI-based hooks exist
6. **Storage operations exposed** - Direct storage calls throughout codebase

---

## Target Architecture (After Migration)

### Domain Identification

Based on analysis, we've identified **3 primary domains** with clear boundaries:

#### 1. **Content Models Domain**
Management of content model definitions (schemas).

**Responsibilities:**
- Define and validate model schemas
- Manage model lifecycle (create, update, delete)
- Combine DB-stored and code-defined models
- Handle model versioning
- Model field validation

**Key Entities:** `CmsModel`, `CmsModelField`

#### 2. **Content Model Groups Domain**
Organization and categorization of content models.

**Responsibilities:**
- Manage model groups
- Group membership
- Group access control
- Combine DB-stored and code-defined groups

**Key Entities:** `CmsGroup`

#### 3. **Content Entries Domain**
The largest domain - managing actual content data.

**Sub-domains:**
- **Entry Lifecycle** - Create, update, validate entries
- **Entry Publishing** - Publish, unpublish, republish workflows
- **Entry Deletion** - Soft delete (bin), hard delete, restore
- **Entry Revisions** - Revision management and history
- **Entry Retrieval** - List, get, search, filter entries
- **Entry Location** - Move entries between folders/locations

**Key Entities:** `CmsEntry`, `CmsEntryMeta`, `CmsStorageEntry`

---

## Migration Strategy

### Phase 1: Foundation (Week 1-2)

#### 1.1 Create Domain and Feature Structure

```
packages/api-headless-cms/src/
├── domains/
│   ├── contentModels/
│   │   ├── CmsModel.ts                 # Domain entity/model
│   │   ├── CmsModelField.ts            # Domain entity
│   │   ├── ModelValidator.ts           # Domain service
│   │   ├── abstractions.ts             # Domain abstractions
│   │   ├── errors.ts                   # Domain errors
│   │   └── types.ts                    # Domain types
│   │
│   ├── contentModelGroups/
│   │   ├── CmsGroup.ts                 # Domain entity
│   │   ├── abstractions.ts             # Domain abstractions
│   │   ├── errors.ts                   # Domain errors
│   │   └── types.ts                    # Domain types
│   │
│   └── contentEntries/
│       ├── CmsEntry.ts                 # Domain entity
│       ├── CmsEntryMeta.ts             # Domain value object
│       ├── EntryValidator.ts           # Domain service
│       ├── EntryTransformer.ts         # Domain service
│       ├── abstractions.ts             # Domain abstractions
│       ├── errors.ts                   # Domain errors
│       └── types.ts                    # Domain types
│
├── features/                           # Application layer (use cases)
│   ├── contentModels/
│   │   ├── CreateModel/
│   │   │   ├── abstractions.ts
│   │   │   ├── CreateModelUseCase.ts
│   │   │   ├── events.ts
│   │   │   └── feature.ts
│   │   ├── UpdateModel/
│   │   ├── DeleteModel/
│   │   ├── GetModel/
│   │   ├── ListModels/
│   │   └── shared/
│   │       ├── abstractions.ts         # ModelsRepository
│   │       ├── ModelsRepository.ts     # Infrastructure (DB + plugins)
│   │       └── PluginModelsProvider.ts
│   │
│   ├── contentModelGroups/
│   │   ├── CreateGroup/
│   │   ├── UpdateGroup/
│   │   ├── DeleteGroup/
│   │   ├── GetGroup/
│   │   ├── ListGroups/
│   │   └── shared/
│   │       ├── abstractions.ts         # GroupsRepository
│   │       ├── GroupsRepository.ts     # Infrastructure (DB + plugins)
│   │       └── PluginGroupsProvider.ts
│   │
│   └── contentEntries/
│       ├── CreateEntry/
│       │   ├── abstractions.ts
│       │   ├── CreateEntryUseCase.ts
│       │   ├── decorators/
│       │   │   ├── CreateEntrySecureDecorator.ts
│       │   │   └── CreateEntryValidationDecorator.ts
│       │   ├── events.ts
│       │   └── feature.ts
│       ├── UpdateEntry/
│       ├── DeleteEntry/
│       ├── PublishEntry/
│       ├── UnpublishEntry/
│       ├── RepublishEntry/
│       ├── GetEntry/
│       ├── ListEntries/
│       ├── MoveEntry/
│       ├── RestoreEntry/
│       ├── CreateRevision/
│       ├── GetRevisions/
│       ├── DeleteRevision/
│       └── shared/
│           ├── abstractions.ts         # EntriesRepository
│           └── EntriesRepository.ts    # Infrastructure
│
├── legacy/                             # Backward compatibility layer
│   ├── crud/                           # Keep original files temporarily
│   │   ├── contentModel.crud.ts
│   │   ├── contentModelGroup.crud.ts
│   │   └── contentEntry.crud.ts
│   └── adapters/                       # Adapters from legacy to new
│       └── LegacyContextAdapter.ts
│
└── types/                              # Keep for now, gradually migrate
    ├── types.ts
    ├── context.ts
    └── plugins.ts
```

**Key Architecture Layers:**

| Layer | Location | Responsibility | Examples |
|-------|----------|---------------|----------|
| **Domain** | `src/domains/` | Business entities, value objects, domain services, domain logic | `CmsModel`, `CmsEntry`, `ModelValidator` |
| **Application** | `src/features/` | Use cases, repositories, application services, orchestration | `CreateModelUseCase`, `ModelsRepository` |
| **Infrastructure** | `src/features/*/shared/` | External concerns, storage, plugins | Repository implementations |
| **Legacy** | `src/legacy/` | Backward compatibility, adapters | `LegacyContextAdapter` |

#### 1.2 Create Domain Layer

**Example: Domain Entity**

```typescript
// domains/contentModels/CmsModel.ts
import type { CmsModelField } from "./CmsModelField.js";

export interface CmsModel {
    modelId: string;
    name: string;
    singularApiName: string;
    pluralApiName: string;
    fields: CmsModelField[];
    layout?: string[][];
    group: string;
    description?: string;
    tenant: string;
    locale: string;
    createdOn: string;
    savedOn: string;
    createdBy: Record<string, any>;
}
```

**Example: Domain Service**

```typescript
// domains/contentModels/ModelValidator.ts
import type { CmsModel } from "./CmsModel.js";

export class ModelValidator {
    validate(model: CmsModel): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!model.modelId) {
            errors.push("modelId is required");
        }

        if (!model.name) {
            errors.push("name is required");
        }

        // Domain validation logic...

        return { valid: errors.length === 0, errors };
    }
}
```

#### 1.3 Create Feature Abstractions

**Example: Repository Abstraction (Application Layer)**

```typescript
// features/contentModels/shared/abstractions.ts
import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { CmsModel } from "~/domains/contentModels/CmsModel.js";
import type { ModelNotFoundError, ModelStorageError } from "~/domains/contentModels/errors.js";

export interface IModelsRepositoryErrors {
    base: ModelNotFoundError | ModelStorageError;
}

type RepositoryError = IModelsRepositoryErrors[keyof IModelsRepositoryErrors];

/**
 * ModelsRepository follows CQS (Command-Query Separation):
 * - Queries (get, list): Return data wrapped in Result
 * - Commands (create, update, delete): Return Result<void, Error>
 */
export interface IModelsRepository {
    // Queries - return data
    get(modelId: string): Promise<Result<CmsModel, RepositoryError>>;
    list(): Promise<Result<CmsModel[], RepositoryError>>;

    // Commands - return void (side effects only)
    create(model: CmsModel): Promise<Result<void, RepositoryError>>;
    update(modelId: string, data: Partial<CmsModel>): Promise<Result<void, RepositoryError>>;
    delete(modelId: string): Promise<Result<void, RepositoryError>>;
}

export const ModelsRepository = createAbstraction<IModelsRepository>("ModelsRepository");

export namespace ModelsRepository {
    export type Interface = IModelsRepository;
    export type Error = RepositoryError;
}
```

#### 1.4 Implement Repository Pattern for Dual Sources

**Key Innovation: Unified Repository for DB + Code Models**

Following the pattern from `api-core` (GroupProvider/TeamProvider), create repositories that transparently handle both database-stored and plugin-defined models.

```typescript
// features/contentModels/shared/ModelsRepository.ts
import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ModelsRepository as RepositoryAbstraction } from "./abstractions.js";
import { ModelNotFoundError, ModelStorageError } from "~/domains/contentModels/errors.js";
import type { HeadlessCmsStorageOperations } from "~/types/index.js";
import type { CmsModel } from "~/domains/contentModels/CmsModel.js";

class ModelsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private storageOperations: HeadlessCmsStorageOperations,
        private pluginModels: CmsModel[],  // Injected from plugin registry
        private accessControl: AccessControl.Interface
    ) {}

    async get(modelId: string): Promise<Result<CmsModel, RepositoryAbstraction.Error>> {
        // 1. Check plugin models first (code-defined, cached)
        const pluginModel = this.pluginModels.find(m => m.modelId === modelId);
        if (pluginModel) {
            const canAccess = await this.accessControl.canAccessModel({ model: pluginModel });
            if (!canAccess) {
                return Result.fail(new ModelNotFoundError(modelId));
            }
            return Result.ok(pluginModel);
        }

        // 2. Query database models
        try {
            const dbModel = await this.storageOperations.models.get({ modelId });
            if (!dbModel) {
                return Result.fail(new ModelNotFoundError(modelId));
            }

            const canAccess = await this.accessControl.canAccessModel({ model: dbModel });
            if (!canAccess) {
                return Result.fail(new ModelNotFoundError(modelId));
            }

            return Result.ok(dbModel);
        } catch (error) {
            return Result.fail(new ModelStorageError(error as Error));
        }
    }

    async list(): Promise<Result<CmsModel[], RepositoryAbstraction.Error>> {
        try {
            // 1. Get DB models
            const dbModels = await this.storageOperations.models.list();

            // 2. Combine with plugin models
            const allModels = [...this.pluginModels, ...dbModels];

            // 3. Apply access control
            const accessibleModels = await Promise.all(
                allModels.map(async model => {
                    const canAccess = await this.accessControl.canAccessModel({ model });
                    return canAccess ? model : null;
                })
            );

            return Result.ok(accessibleModels.filter(Boolean) as CmsModel[]);
        } catch (error) {
            return Result.fail(new ModelStorageError(error as Error));
        }
    }

    async create(model: CmsModel): Promise<Result<void, RepositoryAbstraction.Error>> {
        // Only DB models can be created (plugin models are code-defined)
        try {
            await this.storageOperations.models.create(model);
            return Result.ok(); // ✅ CQS: Commands return void
        } catch (error) {
            return Result.fail(new ModelStorageError(error as Error));
        }
    }

    async update(
        modelId: string,
        data: Partial<CmsModel>
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        // Cannot update plugin models
        const pluginModel = this.pluginModels.find(m => m.modelId === modelId);
        if (pluginModel) {
            return Result.fail(
                new ModelStorageError(
                    new Error("Cannot update code-defined models")
                )
            );
        }

        try {
            await this.storageOperations.models.update(modelId, data);
            return Result.ok(); // ✅ CQS: Commands return void
        } catch (error) {
            return Result.fail(new ModelStorageError(error as Error));
        }
    }

    async delete(modelId: string): Promise<Result<void, RepositoryAbstraction.Error>> {
        // Cannot delete plugin models
        const pluginModel = this.pluginModels.find(m => m.modelId === modelId);
        if (pluginModel) {
            return Result.fail(
                new ModelStorageError(
                    new Error("Cannot delete code-defined models")
                )
            );
        }

        try {
            await this.storageOperations.models.delete(modelId);
            return Result.ok();
        } catch (error) {
            return Result.fail(new ModelStorageError(error as Error));
        }
    }
}

export const ModelsRepositoryImpl = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: ModelsRepositoryImpl,
    dependencies: [
        HeadlessCmsStorageOperations,
        PluginModelsProvider,  // New: provides plugin models
        AccessControl
    ]
});
```

---

### Phase 2: Use Case Implementation (Week 3-4)

#### 2.0 CQS (Command-Query Separation) Principle

**All repositories and use cases MUST follow CQS principle:**

| Type | Returns | Side Effects | Examples |
|------|---------|--------------|----------|
| **Query** | `Result<Data, Error>` | No side effects (read-only) | `get()`, `list()`, `find()` |
| **Command** | `Result<void, Error>` | Has side effects (write) | `create()`, `update()`, `delete()` |

**Repository Pattern with CQS:**

```typescript
interface IModelsRepository {
    // ✅ Queries - return data
    get(id: string): Promise<Result<CmsModel, Error>>;
    list(): Promise<Result<CmsModel[], Error>>;

    // ✅ Commands - return void
    create(model: CmsModel): Promise<Result<void, Error>>;
    update(id: string, data: Partial<CmsModel>): Promise<Result<void, Error>>;
    delete(id: string): Promise<Result<void, Error>>;
}
```

**Use Case Pattern with CQS:**

```typescript
// ✅ Command Use Case
interface ICreateModel {
    execute(input: CreateModelInput): Promise<Result<void, Error>>;
}

// ✅ Query Use Case
interface IGetModel {
    execute(input: GetModelInput): Promise<Result<CmsModel, Error>>;
}

// ✅ Query Use Case (list)
interface IListModels {
    execute(input: ListModelsInput): Promise<Result<CmsModel[], Error>>;
}
```

**Benefits:**
1. ✅ Clear separation between reads and writes
2. ✅ Easier to reason about side effects
3. ✅ Better caching strategies (queries can be cached)
4. ✅ Simpler testing (queries are pure functions)
5. ✅ Follows api-core patterns

**Note:** Storage operations (legacy) can remain unchanged. Only repositories and use cases follow CQS.

**Entries Repository Example with CQS:**

```typescript
interface IEntriesRepository {
    // ✅ Queries
    get(model: CmsModel, id: string): Promise<Result<CmsEntry, Error>>;
    getLatestRevision(model: CmsModel, entryId: string): Promise<Result<CmsEntry, Error>>;
    getPublishedRevision(model: CmsModel, entryId: string): Promise<Result<CmsEntry, Error>>;
    list(model: CmsModel, params: ListParams): Promise<Result<[CmsEntry[], Meta], Error>>;
    getRevisions(model: CmsModel, entryId: string): Promise<Result<CmsEntry[], Error>>;

    // ✅ Commands
    create(model: CmsModel, entry: CmsEntry): Promise<Result<void, Error>>;
    update(model: CmsModel, id: string, data: Partial<CmsEntry>): Promise<Result<void, Error>>;
    delete(model: CmsModel, id: string): Promise<Result<void, Error>>;
    publish(model: CmsModel, id: string): Promise<Result<void, Error>>;
    unpublish(model: CmsModel, id: string): Promise<Result<void, Error>>;
    moveToBin(model: CmsModel, id: string): Promise<Result<void, Error>>;
    restoreFromBin(model: CmsModel, id: string): Promise<Result<void, Error>>;
}
```

---

#### 2.1 Content Models Use Cases

**Example: CreateModel Use Case**

```typescript
// features/contentModels/CreateModel/abstractions.ts
import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ModelsRepository } from "../shared/abstractions.js";
import type { CmsModel } from "~/domains/contentModels/CmsModel.js";

export interface CreateModelInput {
    name: string;
    modelId: string;
    group: string;
    fields: any[];  // Field definitions
    layout?: string[][];
    description?: string;
}

export interface ICreateModelErrors {
    validation: ModelValidationError;
    alreadyExists: ModelAlreadyExistsError;
}

type CreateModelError = ICreateModelErrors[keyof ICreateModelErrors] | ModelsRepository.Error;

/**
 * CreateModel follows CQS:
 * This is a COMMAND - returns Result<void, Error>
 * To get the created model, use GetModel query
 */
export interface ICreateModel {
    execute(input: CreateModelInput): Promise<Result<void, CreateModelError>>;
}

export const CreateModel = createAbstraction<ICreateModel>("CreateModel");

export namespace CreateModel {
    export type Interface = ICreateModel;
    export type Error = CreateModelError;
    export type Input = CreateModelInput;
}
```

```typescript
// features/contentModels/CreateModel/CreateModelUseCase.ts
import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { CreateModel as UseCaseAbstraction } from "./abstractions.js";
import { ModelsRepository } from "../shared/abstractions.js";
import { EventPublisher } from "@webiny/api-core";
import { ModelBeforeCreateEvent, ModelAfterCreateEvent } from "./events.js";
import { ModelValidationError, ModelAlreadyExistsError } from "~/domains/contentModels/errors.js";

class CreateModelUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: ModelsRepository.Interface,
        private eventPublisher: EventPublisher.Interface,
        private validator: ModelValidator.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<void, UseCaseAbstraction.Error>> {
        // 1. Validate input
        const validation = await this.validator.validate(input);
        if (validation.isFail()) {
            return Result.fail(new ModelValidationError(validation.error.message));
        }

        // 2. Check if model already exists
        const existing = await this.repository.get(input.modelId);
        if (existing.isOk()) {
            return Result.fail(new ModelAlreadyExistsError(input.modelId));
        }

        // 3. Create model object
        const model: CmsModel = {
            ...input,
            tenant: getTenant().id,
            locale: getLocale().code,
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString(),
            createdBy: getIdentity()
        };

        // 4. Publish before event
        await this.eventPublisher.publish(
            new ModelBeforeCreateEvent({ model, input })
        );

        // 5. Save to repository (CQS: returns void)
        const result = await this.repository.create(model);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        // 6. Publish after event
        await this.eventPublisher.publish(
            new ModelAfterCreateEvent({ model, input })
        );

        // ✅ CQS: Command returns void
        // Client can use GetModel query to retrieve created model
        return Result.ok();
    }
}

export const CreateModelUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: CreateModelUseCaseImpl,
    dependencies: [ModelsRepository, EventPublisher, ModelValidator]
});
```

#### 2.2 Content Entries Use Cases

**Priority Order for Migration:**

1. ✅ **CreateEntry** - Most fundamental operation
2. ✅ **GetEntry** - Single entry retrieval
3. ✅ **ListEntries** - Bulk retrieval with filtering
4. ✅ **UpdateEntry** - Entry modification
5. ✅ **PublishEntry** - Publishing workflow
6. ✅ **UnpublishEntry** - Unpublishing workflow
7. ✅ **DeleteEntry** - Soft delete to bin
8. ✅ **RestoreEntry** - Restore from bin
9. ✅ **CreateRevision** - Revision branching
10. ✅ **GetRevisions** - Revision history

**IMPORTANT:** Existing use cases in `crud/contentEntry/useCases/` need **refactoring to new DI architecture**. Keep existing logic but adapt to proper abstractions and feature structure.

### Current Architecture Issues

1. **No DI abstractions** - Use cases don't use `createAbstraction` or `createImplementation`
2. **Manual composition** - Decorators manually composed in factory functions
3. **Events as decorators** - Events wrapped as decorators instead of being in use case
4. **Concrete dependencies** - Constructor takes concrete types, not abstractions

### Migration Strategy: Refactor to New Architecture

**Current Structure (Example: DeleteEntry):**
```
crud/contentEntry/useCases/DeleteEntry/
├── DeleteEntry.ts                      # Orchestrator
├── DeleteEntryOperation.ts             # Base operation
├── DeleteEntryOperationWithEvents.ts   # ❌ Events as decorator
├── DeleteEntrySecure.ts                # ✅ Real decorator (authorization)
├── TransformEntryDelete.ts             # ✅ Real decorator (transform)
└── index.ts                            # Manual factory
```

**Target Structure:**
```
features/contentEntries/DeleteEntry/
├── abstractions.ts                     # DI abstractions
├── DeleteEntryUseCase.ts               # Use case with events inside ✅
├── decorators/
│   ├── DeleteEntrySecureDecorator.ts   # Authorization (from Secure)
│   └── DeleteEntryTransformDecorator.ts # Transform (from Transform)
├── events.ts                           # Event class definitions
└── feature.ts                          # DI registration
```

### Refactoring Pattern

**Step 1: Create Abstractions**
```typescript
// features/contentEntries/DeleteEntry/abstractions.ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry } from "~/domains/contentEntries/CmsEntry.js";
import type { CmsModel } from "~/domains/contentModels/CmsModel.js";

export interface DeleteEntryInput {
    model: CmsModel;
    id: string;
    options?: { force?: boolean };
}

export interface IDeleteEntry {
    execute(input: DeleteEntryInput): Promise<void>;
}

export const DeleteEntry = createAbstraction<IDeleteEntry>("DeleteEntry");

export namespace DeleteEntry {
    export type Interface = IDeleteEntry;
    export type Input = DeleteEntryInput;
}
```

**Step 2: Refactor Use Case (Merge Operation + Events)**

```typescript
// features/contentEntries/DeleteEntry/DeleteEntryUseCase.ts
import { createImplementation } from "@webiny/feature/api";
import { DeleteEntry as UseCaseAbstraction } from "./abstractions.js";
import { EntriesRepository } from "../shared/abstractions.js";
import { EventPublisher } from "@webiny/api-core";
import { EntryBeforeDeleteEvent, EntryAfterDeleteEvent } from "./events.js";

class DeleteEntryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: EntriesRepository.Interface,
        private eventPublisher: EventPublisher.Interface  // ✅ Events in use case
    ) {}

    async execute(input: UseCaseAbstraction.Input): Promise<void> {
        const { model, id, options } = input;

        // Get entry
        const entry = await this.repository.getLatestRevision(model, id);
        if (!entry && !options?.force) {
            throw new NotFoundError(`Entry "${id}" was not found!`);
        }

        // ✅ Publish BEFORE event (part of use case logic)
        await this.eventPublisher.publish(
            new EntryBeforeDeleteEvent({ model, entry, input })
        );

        // Execute deletion
        await this.repository.delete(model, { entry });

        // ✅ Publish AFTER event (part of use case logic)
        await this.eventPublisher.publish(
            new EntryAfterDeleteEvent({ model, entry, input })
        );
    }
}

export const DeleteEntryUseCaseImpl = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: DeleteEntryUseCaseImpl,
    dependencies: [EntriesRepository, EventPublisher]  // ✅ EventPublisher injected
});
```

**Step 3: Refactor ONLY Real Decorators (Not Events)**

```typescript
// features/contentEntries/DeleteEntry/decorators/DeleteEntrySecureDecorator.ts
import { createDecorator } from "@webiny/feature/api";
import { DeleteEntry } from "../abstractions.js";
import { AccessControl } from "~/crud/AccessControl/abstractions.js";

// ✅ Refactor DeleteEntrySecure - this IS a real decorator (cross-cutting concern)
class DeleteEntrySecureDecoratorImpl implements DeleteEntry.Interface {
    constructor(
        private accessControl: AccessControl.Interface,
        private decoratee: DeleteEntry.Interface
    ) {}

    async execute(input: DeleteEntry.Input): Promise<void> {
        // Authorization check
        await this.accessControl.ensureCanDelete({ model: input.model });

        // Delegate to use case
        return this.decoratee.execute(input);
    }
}

export const DeleteEntrySecureDecorator = createDecorator({
    abstraction: DeleteEntry,
    decorator: DeleteEntrySecureDecoratorImpl,
    dependencies: [AccessControl]
});
```

**Step 4: Feature Registration**
```typescript
// features/contentEntries/DeleteEntry/feature.ts
import { createFeature } from "@webiny/feature";
import { DeleteEntryUseCaseImpl } from "./DeleteEntryUseCase.js";
import { DeleteEntrySecureDecorator } from "./decorators/DeleteEntrySecureDecorator.js";
import { DeleteEntryTransformDecorator } from "./decorators/DeleteEntryTransformDecorator.js";

export const DeleteEntryFeature = createFeature({
    name: "DeleteEntry",
    register(container) {
        // Register use case (with events inside)
        container.register(DeleteEntryUseCaseImpl);

        // Register ONLY real decorators (not events)
        container.registerDecorator(DeleteEntrySecureDecorator);
        container.registerDecorator(DeleteEntryTransformDecorator);
    }
});
```

### Key Refactoring Rules

1. ✅ **Events IN use case** - Not as decorators, directly in use case logic
2. ✅ **Keep real decorators** - Authorization, Transform, Validation are decorators
3. ✅ **Merge Operation + WithEvents** - Combine into single use case
4. ✅ **EventPublisher injected** - Use case depends on EventPublisher
5. ✅ **Keep existing logic** - Just restructure, don't change behavior
6. ❌ **No event decorators** - Remove `*WithEvents` pattern entirely

---

### Phase 3: Event System Unification (Week 5)

#### 3.1 Migrate from Pub/Sub Topics to DI Events

**Current State:**
```typescript
// In CRUD files - pub/sub pattern
const onEntryBeforeCreate = createTopic<OnEntryBeforeCreateTopicParams>("cms.onEntryBeforeCreate");
await onEntryBeforeCreate.publish({ entry, model });
```

**Target State:**
```typescript
// In use cases - DI-based events
await this.eventPublisher.publish(
    new EntryBeforeCreateEvent({ entry, model })
);
```

#### 3.2 Event Definitions

```typescript
// domains/contentEntries/features/CreateEntry/events.ts
import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";
import type { CmsEntry, CmsModel, CreateEntryInput } from "~/types/index.js";

export interface EntryBeforeCreatePayload {
    entry: CmsEntry;
    model: CmsModel;
    input: CreateEntryInput;
}

export class EntryBeforeCreateEvent extends DomainEvent<EntryBeforeCreatePayload> {
    eventType = "entry.beforeCreate" as const;

    getHandlerAbstraction() {
        return EntryBeforeCreateHandler;
    }
}

export const EntryBeforeCreateHandler = createAbstraction<
    IEventHandler<EntryBeforeCreateEvent>
>("EntryBeforeCreateHandler");

export namespace EntryBeforeCreateHandler {
    export type Interface = IEventHandler<EntryBeforeCreateEvent>;
    export type Event = EntryBeforeCreateEvent;
}

// After event
export interface EntryAfterCreatePayload {
    entry: CmsEntry;
    model: CmsModel;
    input: CreateEntryInput;
}

export class EntryAfterCreateEvent extends DomainEvent<EntryAfterCreatePayload> {
    eventType = "entry.afterCreate" as const;

    getHandlerAbstraction() {
        return EntryAfterCreateHandler;
    }
}

export const EntryAfterCreateHandler = createAbstraction<
    IEventHandler<EntryAfterCreateEvent>
>("EntryAfterCreateHandler");

export namespace EntryAfterCreateHandler {
    export type Interface = IEventHandler<EntryAfterCreateEvent>;
    export type Event = EntryAfterCreateEvent;
}
```

#### 3.3 Migration Strategy for Events

1. **Keep both systems temporarily** - Allow gradual migration
2. **Create bridge adapters** - Convert pub/sub to event handlers
3. **Deprecate pub/sub topics** - Mark as deprecated, log warnings
4. **Remove in next major version** - Clean removal path

---

### Phase 4: Feature Registration (Week 6)

#### 4.1 Feature Definitions

```typescript
// domains/contentModels/features/CreateModel/feature.ts
import { createFeature } from "@webiny/feature";
import { CreateModelUseCaseImpl } from "./CreateModelUseCase.js";
import { CreateModelValidationDecorator } from "./decorators/ValidationDecorator.js";
import { CreateModelAuthorizationDecorator } from "./decorators/AuthorizationDecorator.js";

export const CreateModelFeature = createFeature({
    name: "CreateModel",
    register(container) {
        // Register use case
        container.register(CreateModelUseCaseImpl);

        // Register decorators
        container.registerDecorator(CreateModelValidationDecorator);
        container.registerDecorator(CreateModelAuthorizationDecorator);
    }
});
```

#### 4.2 Domain-Level Features

```typescript
// domains/contentModels/feature.ts
import { createFeature } from "@webiny/feature";
import { CreateModelFeature } from "./features/CreateModel/feature.js";
import { UpdateModelFeature } from "./features/UpdateModel/feature.js";
import { DeleteModelFeature } from "./features/DeleteModel/feature.js";
import { GetModelFeature } from "./features/GetModel/feature.js";
import { ListModelsFeature } from "./features/ListModels/feature.js";
import { ModelsRepositoryImpl } from "./shared/ModelsRepository.js";
import { ModelValidatorImpl } from "./shared/ModelValidator.js";

export const ContentModelsFeature = createFeature({
    name: "ContentModels",
    register(container) {
        // Register shared components
        container.register(ModelsRepositoryImpl).inSingletonScope();
        container.register(ModelValidatorImpl).inSingletonScope();

        // Register all model features
        CreateModelFeature.register(container);
        UpdateModelFeature.register(container);
        DeleteModelFeature.register(container);
        GetModelFeature.register(container);
        ListModelsFeature.register(container);
    }
});
```

---

### Phase 5: Backward Compatibility Layer (Week 7)

#### 5.1 Legacy Context Adapter

Maintain backward compatibility with existing code that uses the old context API.

```typescript
// legacy/adapters/LegacyContextAdapter.ts
import type { CmsModelContext, CmsGroupContext, CmsEntryContext } from "~/types/index.js";
import { Container } from "@webiny/di";
import { CreateModel } from "~/domains/contentModels/features/CreateModel/abstractions.js";
import { GetModel } from "~/domains/contentModels/features/GetModel/abstractions.js";
// ... other imports

export class LegacyModelContextAdapter implements CmsModelContext {
    constructor(private container: Container) {}

    async createModel(data: any) {
        const useCase = this.container.resolve(CreateModel);
        const result = await useCase.execute(data);

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }

    async getModel(modelId: string) {
        const useCase = this.container.resolve(GetModel);
        const result = await useCase.execute({ modelId });

        if (result.isFail()) {
            throw new NotFoundError(result.error.message);
        }

        return result.value;
    }

    // ... implement all other methods
}
```

#### 5.2 Dual Registration

```typescript
// context.ts (main context creation)
export const createHeadlessCmsContext = () => {
    return new ContextPlugin<CmsContext>(async context => {
        const container = new Container();

        // Register all features
        ContentModelsFeature.register(container);
        ContentModelGroupsFeature.register(container);
        ContentEntriesFeature.register(container);

        // LEGACY: Backward compatible CRUD API
        context.cms.models = new LegacyModelContextAdapter(container);
        context.cms.groups = new LegacyGroupContextAdapter(container);
        context.cms.entries = new LegacyEntryContextAdapter(container);
    });
};
```

---

## Implementation Checklist

### Phase 1: Foundation ✅
- [ ] Create domain folder structure
- [ ] Define shared abstractions for all domains
- [ ] Implement ModelsRepository (DB + plugin models)
- [ ] Implement GroupsRepository (DB + plugin groups)
- [ ] Implement EntriesRepository
- [ ] Create domain-specific error classes
- [ ] Create PluginModelsProvider abstraction
- [ ] Create PluginGroupsProvider abstraction

### Phase 2: Use Cases ✅
- [ ] **Content Models:**
  - [ ] CreateModel use case (with domain events and event handler abstractions)
  - [ ] UpdateModel use case (with domain events and event handler abstractions)
  - [ ] DeleteModel use case (with domain events and event handler abstractions)
  - [ ] GetModel use case
  - [ ] ListModels use case
- [ ] **Content Model Groups:**
  - [ ] CreateGroup use case (with domain events and event handler abstractions)
  - [ ] UpdateGroup use case (with domain events and event handler abstractions)
  - [ ] DeleteGroup use case (with domain events and event handler abstractions)
  - [ ] GetGroup use case
  - [ ] ListGroups use case
- [ ] **Content Entries:**
  - [ ] CreateEntry use case (with domain events and event handler abstractions)
  - [ ] UpdateEntry use case (with domain events and event handler abstractions)
  - [ ] DeleteEntry use case (move to bin) (with domain events and event handler abstractions)
  - [ ] RestoreEntry use case (with domain events and event handler abstractions)
  - [ ] GetEntry use case
  - [ ] ListEntries use case
  - [ ] PublishEntry use case (with domain events and event handler abstractions)
  - [ ] UnpublishEntry use case (with domain events and event handler abstractions)
  - [ ] RepublishEntry use case (with domain events and event handler abstractions)
  - [ ] CreateRevision use case (with domain events and event handler abstractions)
  - [ ] GetRevisions use case 
  - [ ] DeleteRevision use case (with domain events and event handler abstractions)
  - [ ] MoveEntry use case (with domain events and event handler abstractions)

### Phase 3: Events ✅
- [ ] Define all domain events
- [ ] Create event handler abstractions
- [ ] Migrate from pub/sub topics to EventPublisher
- [ ] Create bridge adapters for backward compatibility
- [ ] Update all use cases to publish events

### Phase 4: Features ✅
- [ ] Create feature definitions for all use cases
- [ ] Create domain-level feature aggregators
- [ ] Register features in DI container
- [ ] Add decorators for cross-cutting concerns

### Phase 5: Compatibility ✅
- [ ] Create LegacyContextAdapter
- [ ] Implement all legacy context methods
- [ ] Add deprecation warnings
- [ ] Write migration guide for consumers
- [ ] Update documentation

### Phase 6: Testing & Validation ✅
- [ ] Write unit tests for all use cases
- [ ] Write integration tests for repositories
- [ ] Test backward compatibility
- [ ] Performance testing
- [ ] Update existing tests

---

## Repository Pattern Details

### Key Innovation: Provider Pattern for Plugin Models

Following `api-core` pattern:

```typescript
// domains/contentModels/shared/abstractions.ts
export interface IPluginModelsProvider {
    getModels(): Promise<CmsModel[]>;
}

export const PluginModelsProvider = createAbstraction<IPluginModelsProvider>(
    "PluginModelsProvider"
);

export namespace PluginModelsProvider {
    export type Interface = IPluginModelsProvider;
}
```

```typescript
// domains/contentModels/shared/PluginModelsProvider.ts
class PluginModelsProviderImpl implements PluginModelsProvider.Interface {
    constructor(
        private pluginRegistry: PluginRegistry,
        private tenantContext: TenantContext.Interface,
        private localeContext: LocaleContext.Interface
    ) {}

    async getModels(): Promise<CmsModel[]> {
        const tenant = this.tenantContext.getTenant();
        const locale = this.localeContext.getLocale();

        const plugins = this.pluginRegistry.byType<CmsModelPlugin>(
            CmsModelPlugin.type
        );

        return plugins
            .filter(plugin => {
                const model = plugin.contentModel;
                // Filter by tenant/locale if specified
                if (model.tenant && model.tenant !== tenant.id) return false;
                if (model.locale && model.locale !== locale.code) return false;
                return true;
            })
            .map(plugin => ({
                ...plugin.contentModel,
                tenant: tenant.id,
                locale: locale.code
            }));
    }
}
```

**Benefits:**
1. ✅ Single repository interface for consumers
2. ✅ Transparent handling of dual sources
3. ✅ Proper access control applied to both
4. ✅ Caching handled at repository level
5. ✅ Clear separation between code and DB models

---

## Domain Event Examples

### Content Model Events

```typescript
// Model lifecycle
model.beforeCreate
model.afterCreate
model.beforeUpdate
model.afterUpdate
model.beforeDelete
model.afterDelete
model.createError
model.updateError
model.deleteError
```

### Content Entry Events

```typescript
// Entry lifecycle
entry.beforeCreate
entry.afterCreate
entry.beforeUpdate
entry.afterUpdate
entry.beforeDelete
entry.afterDelete

// Publishing
entry.beforePublish
entry.afterPublish
entry.beforeUnpublish
entry.afterUnpublish
entry.beforeRepublish
entry.afterRepublish

// Revisions
entry.revision.beforeCreate
entry.revision.afterCreate
entry.revision.beforeDelete
entry.revision.afterDelete

// Location
entry.beforeMove
entry.afterMove

// Soft delete
entry.beforeMoveToBin
entry.afterMoveToBin
entry.beforeRestoreFromBin
entry.afterRestoreFromBin

// Errors
entry.createError
entry.updateError
entry.deleteError
entry.publishError
entry.unpublishError
entry.republishError
```

---

## Migration Risks & Mitigations

### Risk 1: Breaking Changes
**Mitigation:** Maintain backward compatibility layer for entire migration period. Deprecate gradually.

### Risk 2: Performance Regression
**Mitigation:**
- Keep existing caching strategies
- Add performance benchmarks
- Monitor repository query patterns

### Risk 3: Complex Entry Operations
**Mitigation:**
- Migrate simpler operations first (models, groups)
- Use existing use case structure as foundation
- Extensive testing for entry workflows

### Risk 4: Plugin Compatibility
**Mitigation:**
- Keep plugin interfaces unchanged (out of scope)
- Provider pattern isolates plugin handling
- Test with real plugin implementations

---

## Success Criteria

1. ✅ All CRUD operations available as use cases
2. ✅ Repository pattern successfully unifies DB + plugin models
3. ✅ Event system migrated to DI-based handlers
4. ✅ Full backward compatibility maintained
5. ✅ Test coverage equivalent or better than current
6. ✅ Performance equivalent or better than current
7. ✅ Clear domain boundaries established
8. ✅ Documentation updated

---

## Timeline

**Total Estimated Time: 7-8 weeks**

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | 2 weeks | Domain structure, repositories, abstractions |
| Phase 2 | 2 weeks | All use cases implemented |
| Phase 3 | 1 week | Event system migrated |
| Phase 4 | 1 week | Features registered |
| Phase 5 | 1 week | Backward compatibility |
| Phase 6 | 1-2 weeks | Testing, validation, documentation |

---

## Next Steps

1. **Review & Approve** this migration plan
2. **Create tracking issues** for each phase
3. **Set up feature branches** for parallel development
4. **Begin Phase 1** with domain structure and repositories
5. **Establish testing strategy** before use case implementation

---

## Questions for Clarification

1. Should we migrate all entry use cases, or prioritize specific ones?
2. Is there a specific release timeline we need to align with?
3. Should we keep legacy crud files indefinitely or plan removal?
4. Are there specific plugin implementations we need to test against?
5. Should we introduce any new capabilities during migration (or pure refactor)?
