---
name: webiny-api-architect
context: webiny-extensions
description: >
  The hub skill for all API/backend architecture in Webiny. Covers architecture overview,
  Services vs UseCases, feature naming and organization, feature structure templates,
  DI decision tree, anti-patterns, createFeature, createAbstraction, container registration,
  domain errors, entity patterns, naming conventions, scoping rules, and code conventions.
  Use this skill for ANY backend API work — it references sub-skills for deep implementation details.
---

# API Architecture Patterns

## TL;DR

API extensions use `createFeature` to register features into the DI container. Each feature is a vertical slice with abstractions, implementations, and a `feature.ts` registration file. The key abstractions are **Services** (multi-method, singleton) and **UseCases** (single-method orchestrators, transient). Repositories handle persistence via CMS. Features are named by **business capability**, files inside by **technical responsibility**.

## Architecture Overview

```
Extension (root) ── registers ──> Features + GraphQL Schemas + Models
    Feature ── registers ──> UseCase | Service | EventHandler + Repository
        UseCase ── depends on ──> Service | Repository (+ EventPublisher)
            Repository ── depends on ──> CMS Use Cases (GetModel, CreateEntry, etc.)
        Service ── depends on ──> external APIs, other Services
```

- **Extension**: Top-level entry point. Registers all features, GraphQL schemas, and CMS models.
- **Feature**: A vertical slice. Registers its use cases, services, repositories, and event handlers.
- **UseCase**: Single-method orchestrator (`execute()`). Coordinates services, repositories, and events. Transient scope.
- **Service**: Multi-method abstraction for external API calls or cohesive domain logic. Singleton scope.
- **Repository**: Persistence layer using CMS as storage. Singleton scope.
- **EventHandler**: Thin orchestrator reacting to domain events. Delegates to services/use cases.
- **GraphQL Schema**: Defines types, inputs, queries, and mutations. Resolvers delegate to use cases.
- **CMS Model**: Defines the data schema stored in headless CMS.

---

## Services vs UseCases

### Services

Multi-method abstractions for **external API calls** or **cohesive domain logic**. A service groups related operations that belong together.

```ts
// abstractions.ts
export interface ILingotekService {
  translate(documentId: string, targetLocale: string): Promise<Result<void, Error>>;
  getTranslationStatus(documentId: string): Promise<Result<TranslationStatus, Error>>;
  deleteProject(projectId: string): Promise<Result<void, Error>>;
}

export const LingotekService = createAbstraction<ILingotekService>("MyExt/LingotekService");

export namespace LingotekService {
  export type Interface = ILingotekService;
}
```

- Registered in **singleton scope** (`.inSingletonScope()`)
- Located in: `features/{serviceName}/` or `features/services/{serviceName}/`
- One service per external system or cohesive domain area
- **If async bootstrap is needed** (loading settings from CMS, fetching remote config): use the **ServiceProvider pattern** — a provider abstraction with `async getService()` that lazily initializes and caches the service. Consumers inject the provider, not the service directly. See the ServiceProvider section below.

### UseCases

Single-method orchestrators with an `execute()` method. They coordinate services, repositories, and events.

```ts
export interface ISyncProjectUseCase {
  execute(input: SyncProjectInput): Promise<Result<Project, SyncProjectError>>;
}
```

- Registered in **transient scope** (default)
- Located in: `features/{ActionEntity}/`
- One use case per business operation

### When to Create a UseCase

- GraphQL mutations need the same logic as event handlers
- Need to coordinate multiple services or repositories
- Business logic must be reusable across entry points (GraphQL, events, CLI)

### When NOT to Create a UseCase

- Simple event handler that calls one service method — inject the service directly
- Simple read queries — inject the service or repository directly into the GraphQL resolver
- Logic that only exists in one place and is unlikely to be reused

### ServiceProvider Pattern (Async Bootstrap)

When a service requires async initialization (loading CMS settings, fetching remote config, API tokens), use a **ServiceProvider** — a provider abstraction with `async getService()` that lazily creates and caches the service. Both the provider and the service are part of the same feature. The provider is the primary abstraction exported from the feature. The service itself is not registered in the DI container.

```ts
// abstractions.ts
export interface ILingotekServiceProvider {
  getService(): Promise<ILingotekService>;
}

export const LingotekServiceProvider = createAbstraction<ILingotekServiceProvider>(
  "MyExt/LingotekServiceProvider"
);

export namespace LingotekServiceProvider {
  export type Interface = ILingotekServiceProvider;
}
```

```ts
// LingotekServiceProvider.ts
class LingotekServiceProviderImpl implements ProviderAbstraction.Interface {
  private service: ILingotekService | undefined;

  constructor(private getSettings: GetSettingsUseCase.Interface) {}

  async getService(): Promise<ILingotekService> {
    if (!this.service) {
      const result = await this.getSettings.execute();
      const settings = result.isOk() ? result.value : defaultSettings;
      this.service = new LingotekService(settings);
    }
    return this.service;
  }
}
```

- Register the **provider** in singleton scope (it caches the service)
- The service itself is NOT registered in DI — it's created by the provider
- Consumers call `await provider.getService()` before using the service
- Use cases and handlers inject `LingotekServiceProvider`, not `LingotekService`

---

## Feature Naming Philosophy

Features use a **two-level naming convention**:

- **Feature directory** = business capability (what it does for the business)
- **Files inside** = technical responsibility (what each file handles)

This makes features **discoverable by what they DO**, and once inside a feature folder, you see the technical components clearly.

### Good

```
features/
├── syncToLingotek/                    ← business capability
│   ├── abstractions.ts
│   ├── SyncProjectUseCase.ts         ← technical responsibility
│   ├── EntryAfterCreateHandler.ts    ← technical responsibility (fine as filename!)
│   ├── EntryAfterUpdateHandler.ts
│   └── feature.ts
├── cleanupLingotekDocument/
│   ├── EntryBeforeDeleteHandler.ts
│   └── feature.ts
```

### Bad

```
features/
├── EntryAfterCreateHandler/          ← ❌ technical name as feature directory
├── DocumentBeforeDeleteHandler/      ← ❌ technical name as feature directory
```

### Rules

- Feature directories describe **business capability**: `syncToLingotek`, `cleanupOnDelete`, `notifySlack`
- Files inside describe **technical responsibility**: `EntryAfterCreateHandler.ts`, `SyncProjectUseCase.ts`
- Event handlers ARE features — they live in `features/`, never in a separate `handlers/` directory

---

## Feature Structure Templates

### Simple Event Handler Feature

When: handler calls a service or use case, no new abstractions needed.

```
features/cleanupOnDelete/
├── CleanupOnDeleteHandler.ts     # Implements an existing EventHandler abstraction
└── feature.ts                    # Registers the handler
```

### Complex Feature with UseCases

When: logic is reused by GraphQL + event handlers, or coordinates multiple services.

```
features/syncProjectToLingotek/
├── abstractions.ts               # UseCase + error types for this feature
├── CreateProjectUseCase.ts
├── UpdateProjectUseCase.ts
├── DeleteProjectUseCase.ts
├── EntryAfterCreateHandler.ts    # Thin handler → delegates to CreateProjectUseCase
├── EntryAfterUpdateHandler.ts    # Thin handler → delegates to UpdateProjectUseCase
├── EntryAfterDeleteHandler.ts    # Thin handler → delegates to DeleteProjectUseCase
└── feature.ts                    # Registers everything
```

### Service Feature

When: reusable multi-method service for an external API or domain area.

```
features/lingotekService/
├── abstractions.ts               # Service interface (multi-method)
├── LingotekService.ts            # Implementation
└── feature.ts                    # Registers in singleton scope
```

---

## DI Decision Tree

### What to inject based on what you're building

| You're building a... | It needs to...             | Inject                                     |
| -------------------- | -------------------------- | ------------------------------------------ |
| **Event Handler**    | Call external API          | Service                                    |
| **Event Handler**    | Orchestrate CMS + external | UseCase                                    |
| **Event Handler**    | Just log/validate          | Logger (or nothing)                        |
| **GraphQL Resolver** | Simple read                | Service or Repository directly             |
| **GraphQL Resolver** | Complex mutation           | UseCase                                    |
| **GraphQL Resolver** | Check permissions          | IdentityContext or Permissions abstraction |
| **UseCase**          | Call external API          | Service                                    |
| **UseCase**          | Persist/read data          | Repository                                 |
| **UseCase**          | Publish domain events      | EventPublisher                             |
| **UseCase**          | Check permissions          | IdentityContext or Permissions abstraction |
| **Repository**       | Access CMS                 | GetModelUseCase, CreateEntryUseCase, etc.  |

---

## Anti-Patterns

### ❌ Creating one abstraction per operation instead of a multi-method Service

```ts
// WRONG — separate abstractions for related operations
export const DeleteDocumentService = createAbstraction(...)
export const CreateDocumentService = createAbstraction(...)
export const UpdateDocumentService = createAbstraction(...)

// CORRECT — one multi-method Service
export interface IDocumentService {
  create(input: CreateInput): Promise<Result<Doc, Error>>;
  update(id: string, input: UpdateInput): Promise<Result<Doc, Error>>;
  delete(id: string): Promise<Result<void, Error>>;
}
export const DocumentService = createAbstraction<IDocumentService>("MyExt/DocumentService");
```

### ❌ Naming features by technical implementation

```
features/DocumentBeforeDeleteHandler/    ← WRONG: technical name
features/cleanupLingotekDocument/        ← CORRECT: business capability
```

### ❌ Assuming builders exist for factories

```ts
// WRONG — no builder pattern exists
builder.role({ ... }).permissions([...])

// CORRECT — factories return plain objects
async execute(): Promise<CodeRole[]> {
  return [{ name: "Admin", slug: "admin", description: "...", permissions: [...] }];
}
```

### ❌ Separate handlers/ directory

```
api/handlers/MyHandler.ts               ← WRONG: handlers are features
features/myFeature/MyHandler.ts          ← CORRECT: handler lives inside its feature
```

### ❌ Using generic Error instead of domain-specific errors

```ts
// WRONG
throw new Error("Not found");

// CORRECT
return Result.fail(new EntityNotFoundError(id));
```

### ❌ Not filtering event handlers by model/entity type

```ts
// WRONG — fires for ALL models
async handle(event) {
  await this.service.doWork(event.payload.entry);
}

// CORRECT — filter by your model
async handle(event) {
  if (event.payload.model.modelId !== MY_MODEL_ID) return;
  await this.service.doWork(event.payload.entry);
}
```

---

## API Directory Structure

```
api/
├── Extension.ts              # API entry point (createFeature, registers everything)
├── domain/
│   ├── errors.ts             # Domain-specific errors (extend BaseError)
│   ├── EntityId.ts           # Value object for entity IDs
│   ├── EntityModel.ts        # CMS model definition (ModelFactory)
│   └── EntityModelExtension.ts  # Abstraction for extending the model
├── features/
│   ├── createEntity/         # Feature: business capability
│   │   ├── abstractions.ts   # UseCase + Repository abstractions + error types
│   │   ├── feature.ts        # DI registration
│   │   ├── CreateEntityUseCase.ts
│   │   └── CreateEntityRepository.ts
│   ├── lingotekService/      # Service feature
│   │   ├── abstractions.ts
│   │   ├── LingotekService.ts
│   │   └── feature.ts
│   └── syncToLingotek/       # Event handler feature
│       ├── EntryAfterCreateHandler.ts
│       └── feature.ts
└── graphql/
    ├── CreateEntitySchema.ts
    └── GetEntitySchema.ts
```

## API Extension Entry Point

```ts
// src/api/Extension.ts
import { createFeature } from "webiny/api";
import EntityModel from "./domain/EntityModel.js";
import CreateEntitySchema from "./graphql/CreateEntitySchema.js";
import { CreateEntityFeature } from "./features/createEntity/feature.js";
import { LingotekServiceFeature } from "./features/lingotekService/feature.js";
import { SyncToLingotekFeature } from "./features/syncToLingotek/feature.js";

export const Extension = createFeature({
  name: "MyExtension",
  register(container) {
    // CMS model (register first)
    container.register(EntityModel);

    // GraphQL schemas
    container.register(CreateEntitySchema);

    // Features (use Feature.register, NOT container.register)
    CreateEntityFeature.register(container);
    LingotekServiceFeature.register(container);
    SyncToLingotekFeature.register(container);
  }
});
```

**Rules:**

- Register the CMS model first.
- Register GraphQL schemas with `container.register()`.
- Register features with `Feature.register(container)` (not `container.register(Feature)`).

## Abstractions

Every piece of business logic starts with a typed abstraction token:

```ts
// src/api/features/createEntity/abstractions.ts
import { createAbstraction, Result } from "webiny/api";
import type { MyEntity } from "~/shared/MyEntity.js";

export interface ICreateEntityInput {
  name: string;
}

export interface ICreateEntityUseCase {
  execute(input: ICreateEntityInput): Promise<Result<MyEntity, Error>>;
}

export const CreateEntityUseCase = createAbstraction<ICreateEntityUseCase>(
  "MyExtension/CreateEntityUseCase"
);

// Namespace re-exports all related types for convenient access
export namespace CreateEntityUseCase {
  export type Interface = ICreateEntityUseCase;
  export type Input = ICreateEntityInput;
}
```

## Feature Registration

```ts
// src/api/features/createEntity/feature.ts
import { createFeature } from "webiny/api";
import CreateEntityUseCase from "./CreateEntityUseCase.js";
import CreateEntityRepository from "./CreateEntityRepository.js";

export const CreateEntityFeature = createFeature({
  name: "CreateEntity",
  register(container) {
    container.register(CreateEntityUseCase); // transient (default)
    container.register(CreateEntityRepository).inSingletonScope(); // singleton
  }
});
```

## Container Registration Methods

| Method                                                   | When to Use                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| `container.register(Implementation)`                     | Register a class (created via `Abstraction.createImplementation`) |
| `container.registerInstance(abstraction, instance)`      | Register a plain object that satisfies the interface              |
| `container.registerFactory(abstraction, () => instance)` | Register a lazy factory                                           |
| `container.registerDecorator(Decorator)`                 | Register a decorator (wraps existing implementation)              |

## Reading API BuildParams

A deployed API must **NEVER** use `process.env` to read configuration. All configuration flows through `BuildParams` via DI:

```ts
import { BuildParams } from "webiny/api";

class MyServiceImpl implements MyService.Interface {
  constructor(private buildParams: BuildParams.Interface) {}

  doSomething() {
    // buildParams.get() returns T | null — always handle null
    const endpoint = this.buildParams.get<string>("MY_API_ENDPOINT");
    if (!endpoint) {
      throw new Error("MY_API_ENDPOINT build param is not configured.");
    }
  }
}

export default MyService.createImplementation({
  implementation: MyServiceImpl,
  dependencies: [BuildParams]
});
```

> **Note:** BuildParam _declarations_ (`<Api.BuildParam>`) live in the top-level extension component — see the **webiny-full-stack-architect** skill.

---

## Domain Errors

Every feature defines domain-specific errors extending `BaseError`:

```ts
// domain/errors.ts
import { BaseError } from "@webiny/feature/api";

export class EntityNotFoundError extends BaseError {
  override readonly code = "Entity/NotFound" as const;

  constructor(id: string) {
    super({ message: `Entity with id "${id}" was not found!` });
  }
}

export class EntityPersistenceError extends BaseError<{ error: Error }> {
  override readonly code = "Entity/Persist" as const;

  constructor(error: Error) {
    super({ message: error.message, data: { error } });
  }
}
```

**Rules:**

- Extend `BaseError` from `@webiny/feature/api`
- Use `override readonly code` with a namespaced string (`"Domain/ErrorType"`)
- Use `as const` on the code for type narrowing
- If passing `data`, define a type and pass it as generic: `BaseError<TDataType>`

### Typed Error Unions in Abstractions

Define error interfaces and union types so consumers know exactly which errors can occur:

```ts
// features/createEntity/abstractions.ts
export interface ICreateEntityErrors {
  persistence: EntityPersistenceError;
  notFound: EntityModelNotFoundError;
  notAuthorized: NotAuthorizedError;
}

type CreateEntityError = ICreateEntityErrors[keyof ICreateEntityErrors];

export interface ICreateEntityUseCase {
  execute(input: CreateEntityInput): Promise<Result<Entity, CreateEntityError>>;
}

export namespace CreateEntityUseCase {
  export type Interface = ICreateEntityUseCase;
  export type Input = CreateEntityInput;
  export type Error = CreateEntityError;
  export type Return = Promise<Result<Entity, CreateEntityError>>;
}
```

- Use case errors are a **superset** of repository errors (use case adds authorization, validation, etc.)
- Export `Error` and `Return` types in the namespace for consumers

---

## Entity / Value Object Patterns

### Entity ID Value Object

```ts
// domain/EntityId.ts
import { EntryId } from "@webiny/api-headless-cms/exports/api/cms/entry.js";

export class EntityId {
  static from(id?: string) {
    if (id) {
      return EntryId.from(id).id; // Ensure clean id without revision suffix
    }
    return EntryId.create().id;
  }
}
```

### Domain Entity Class

```ts
// shared/Entity.ts
export interface EntityDto {
  id: string;
  values: EntityValues;
}

export class Entity {
  private constructor(private dto: EntityDto) {}

  static from(dto: EntityDto) {
    return new Entity(dto);
  }

  get id() {
    return this.dto.id;
  }
  get values() {
    return this.dto.values;
  }
}
```

---

## Public Exports (`index.ts`)

Each feature folder exports **only abstractions** — never features, events, or implementations:

```ts
// features/disableEntity/index.ts
export {
  DisableEntityUseCase,
  EntityBeforeDisableEventHandler,
  EntityAfterDisableEventHandler
} from "./abstractions.js";
```

**Rules:**

- Use `export { }` syntax, NOT `export *`
- Do NOT export `feature.ts`, `events.ts`, or implementation files

---

## Scoping Rules

| Layer          | Scope                 | Rationale                         |
| -------------- | --------------------- | --------------------------------- |
| UseCase        | Transient (default)   | Fresh per invocation              |
| Service        | `.inSingletonScope()` | Stateful or expensive to create   |
| Repository     | `.inSingletonScope()` | One cache instance                |
| Gateway        | `.inSingletonScope()` | Stateless but expensive to create |
| EventHandler   | Transient (default)   | Fresh per event                   |
| CMS Model      | Register normally     | Registered once at boot           |
| GraphQL Schema | Register normally     | Registered once at boot           |

---

## Naming Conventions

| Artifact    | Pattern                                       | Example                           |
| ----------- | --------------------------------------------- | --------------------------------- |
| Feature dir | `{businessCapability}` (camelCase)            | `syncToLingotek`, `createEntity`  |
| UseCase     | `{Action}{Entity}UseCase`                     | `CreateTenantUseCase`             |
| Service     | `{Domain}Service`                             | `LingotekService`                 |
| Repository  | `{Action}{Entity}Repository`                  | `CreateTenantRepository`          |
| Event       | `{Entity}{Before\|After}{Action}Event`        | `TenantBeforeDisableEvent`        |
| Handler     | `{Entity}{Before\|After}{Action}EventHandler` | `TenantBeforeDisableEventHandler` |
| Decorator   | `{Action}{Entity}With{Concern}`               | `GetEntityByIdWithAuthorization`  |
| Mapper      | `EntryTo{Entity}Mapper`                       | `EntryToFolderMapper`             |
| Error       | `{Entity}{Problem}Error`                      | `EntityNotFoundError`             |

---

## Code Conventions

- Use `createAbstraction` from `@webiny/feature/api` — never `new Abstraction()`
- All implementations use `createImplementation` with a `dependencies` array matching constructor order
- Implementation classes are **not exported** — only the `createImplementation` result (as `default`)
- One class per file. One named import per line.
- Use `.js` extensions in all relative imports (ESM)
- Use `~` alias for package-internal absolute imports
- All operations return `Result<T, E>`. Check `result.isFail()` before `result.value`
- Never return `null` — use domain-specific NotFoundError
- Wrap infrastructure errors in domain errors

## Checklist

When building a new API feature:

- [ ] Domain errors defined extending `BaseError` with `override readonly code`
- [ ] Abstractions define error interfaces, union types, and namespaces with `Interface` + `Error`
- [ ] UseCase implements abstraction `.Interface`, uses `createImplementation`
- [ ] Repository implements abstraction `.Interface`, uses CMS use cases, wraps errors
- [ ] Feature registers use case (transient) and repository (singleton)
- [ ] Decorators registered with `container.registerDecorator()`, decoratee is last constructor param
- [ ] Root Extension registers model, schemas, and features
- [ ] GraphQL schema implements `GraphQLSchemaFactory.Interface`
- [ ] Domain events have handler abstractions with `Interface` + `Event` namespace
- [ ] `index.ts` exports abstractions only — no features, no event classes, no implementations
- [ ] All relative imports use `.js` extension
- [ ] One class per file, one import per line

## Core APIs

### `createAbstraction<T>(name: string)`

Creates a typed DI token. The generic `T` is the interface that implementations must satisfy.

| Import  | `import { createAbstraction } from "webiny/api"` |
| ------- | ------------------------------------------------ |
| Returns | `Abstraction<T>`                                 |

### `createFeature(def)`

Creates a feature definition that the framework loads as an extension.

| Import                    | `import { createFeature } from "webiny/api"`              |
| ------------------------- | --------------------------------------------------------- |
| `def.name`                | Unique feature name (convention: `"AppName/FeatureName"`) |
| `def.register(container)` | Called at startup with the DI `Container` instance        |

## Key Rules

1. **Abstractions first** — any new business logic MUST be encapsulated in `createAbstraction` + `createFeature`. Never put logic directly in an EventHandler, GraphQL resolver, or CLI command.
2. **Namespace convention** — every abstraction exports `namespace MyAbstraction { export type Interface = ...; }` so consumers can type dependencies as `MyAbstraction.Interface`.
3. **Name uniqueness** — feature names must be globally unique; use `"AppName/FeatureName"` convention.
4. **Constructor param order** — `dependencies` array must match constructor parameter order exactly.
5. **No `process.env` at runtime** — deployed API services must NEVER read `process.env`. All configuration flows through `BuildParams`.
6. **Scoping** — use cases = transient (default), services/repositories = singleton (`.inSingletonScope()`).
7. **Import extensions** — always use `.js` extensions in import paths (ESM).

## Related Skills

- **webiny-use-case-pattern** — UseCase implementation, Result handling, error types, decorators, CMS repositories
- **webiny-api-permissions** — Schema-based permissions, CRUD authorization patterns, own-record scoping, testing
- **webiny-event-handler-pattern** — EventHandler lifecycle, domain event definition and publishing, handler abstractions
- **webiny-custom-graphql-api** — GraphQL schema creation, dynamic inputs, namespaced mutations
- **webiny-http-route** — Custom HTTP endpoints via `Api.Route` and `Route.Interface`
- **webiny-v5-to-v6-migration** — Side-by-side migration patterns for AI agents
- **webiny-full-stack-architect** — Top-level component, shared domain layer, BuildParam declarations
- **webiny-dependency-injection** — The `createImplementation` DI pattern and injectable services
