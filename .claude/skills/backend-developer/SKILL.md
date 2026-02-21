---
name: backend-developer
description: Use when implementing backend API features. Covers use cases, repositories, GraphQL schemas, CMS data models, domain events, error handling, and DI container wiring for packages under `packages/*/src/api/` or `packages/api-*`.
---

# Backend Developer Guide

## Architecture Overview

```
Extension (root) ── registers ──> Features + GraphQL Schemas + Models
    Feature ── registers ──> UseCase + Repository (+ EventHandlers)
        UseCase ── depends on ──> Repository (+ EventPublisher)
            Repository ── depends on ──> CMS Use Cases (GetModel, CreateEntry, etc.)
```

- **Extension**: Top-level entry point. Registers all features, GraphQL schemas, and the CMS data model.
- **Feature**: A vertical slice (one per use case). Registers the use case and repository in the DI container.
- **UseCase**: Application-layer orchestration. Transient scope (default).
- **Repository**: Persistence layer using CMS as storage. Singleton scope.
- **GraphQL Schema**: Defines types, inputs, queries, and mutations. Resolvers delegate to use cases.
- **CMS Model**: Defines the data schema stored in headless CMS.

---

## Folder Structure

```
src/
├── shared/                           # Shared between api/ and presentation/ (frontend)
│   ├── Entity.ts                     # Domain entity class (DTO, value object)
│   └── constants.ts                  # Model IDs, etc.
├── api/
│   ├── Extension.ts                  # Root feature (registers everything)
│   ├── domain/
│   │   ├── errors.ts                 # Domain-specific errors (extend BaseError)
│   │   ├── EntityId.ts               # Value object for entity IDs
│   │   ├── EntityModel.ts            # CMS model definition (ModelFactory)
│   │   └── EntityModelExtension.ts   # Abstraction for extending the model
│   ├── features/
│   │   ├── CreateEntity/
│   │   │   ├── abstractions.ts       # UseCase + Repository abstractions + error types
│   │   │   ├── feature.ts            # DI registration
│   │   │   ├── CreateEntityUseCase.ts
│   │   │   └── CreateEntityRepository.ts
│   │   ├── GetEntityById/
│   │   │   ├── abstractions.ts
│   │   │   ├── feature.ts
│   │   │   ├── GetEntityByIdUseCase.ts
│   │   │   └── GetEntityByIdRepository.ts
│   │   ├── UpdateEntity/
│   │   │   ├── abstractions.ts
│   │   │   ├── feature.ts
│   │   │   ├── UpdateEntityUseCase.ts
│   │   │   └── UpdateEntityRepository.ts
│   │   ├── DisableEntity/
│   │   │   ├── abstractions.ts
│   │   │   ├── feature.ts
│   │   │   ├── DisableEntityUseCase.ts
│   │   │   └── events.ts             # Domain events (before/after)
│   │   └── ReactToExternalEvent/
│   │       ├── feature.ts
│   │       └── ReactToExternalEventHandler.ts  # Event handler
│   └── graphql/
│       ├── CreateEntitySchema.ts
│       ├── GetCurrentEntitySchema.ts
│       ├── DisableEntitySchema.ts
│       └── EnableEntitySchema.ts
```

---

## Abstractions (`abstractions.ts`)

Every feature starts with abstractions. Define the use case and repository interfaces, error types, and DI tokens.

```typescript
// features/CreateEntity/abstractions.ts
import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import {
  EntityCreationError,
  EntityModelNotFoundError,
  type EntityPersistenceError
} from "~/api/domain/errors.js";
import type { Entity, EntityExtensions } from "~/shared/Entity.js";

// USE CASE

export interface ICreateEntityInput {
  id?: string;
  name: string;
  description?: string;
  extensions: EntityExtensions;
}

export interface ICreateEntityUseCaseErrors {
  persistence: EntityPersistenceError;
  modelNotFoundError: EntityModelNotFoundError;
  notAuthorized: NotAuthorizedError;
  entityCreation: EntityCreationError;
}

export type ICreateEntityUseCaseError =
  ICreateEntityUseCaseErrors[keyof ICreateEntityUseCaseErrors];

export interface ICreateEntityUseCase {
  execute(input: ICreateEntityInput): Promise<Result<Entity, ICreateEntityUseCaseError>>;
}

export const CreateEntityUseCase = createAbstraction<ICreateEntityUseCase>(
  "MyPackage/CreateEntityUseCase"
);

export namespace CreateEntityUseCase {
  export type Interface = ICreateEntityUseCase;
  export type Input = ICreateEntityInput;
  export type Error = ICreateEntityUseCaseError;
}

// REPOSITORY

export interface ICreateEntityRepositoryErrors {
  persistence: EntityPersistenceError;
  modelNotFoundError: EntityModelNotFoundError;
  entityCreation: EntityCreationError;
}

type IRepositoryError = ICreateEntityRepositoryErrors[keyof ICreateEntityRepositoryErrors];

export interface ICreateEntityRepository {
  execute(entity: Entity): Promise<Result<Entity, IRepositoryError>>;
}

export const CreateEntityRepository = createAbstraction<ICreateEntityRepository>(
  "MyPackage/CreateEntityRepository"
);

export namespace CreateEntityRepository {
  export type Interface = ICreateEntityRepository;
  export type Error = IRepositoryError;
  export type Return = Promise<Result<Entity, IRepositoryError>>;
}
```

**Rules:**

- Use `createAbstraction` from `@webiny/feature/api` -- never `new Abstraction()`.
- Abstraction names are namespaced: `"PackageName/UseCaseName"`.
- Define an `IErrors` interface mapping error names to error types, then create a union via `[keyof IErrors]`.
- Export a `namespace` with `Interface`, `Error`, and `Return` types for consumers.
- Namespace should also contain other meaningfull types, if they exist in the abstraction: `Params`, etc.
- Use case errors are a superset of repository errors (use case can add authorization, etc.).

---

## Use Case Implementation

```typescript
// features/CreateEntity/CreateEntityUseCase.ts
import {
  CreateEntityUseCase as UseCaseAbstraction,
  ICreateEntityInput,
  CreateEntityRepository
} from "./abstractions.js";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { Entity } from "~/shared/Entity.js";
import { EntityId } from "~/api/domain/EntityId.js";

class CreateEntityUseCase implements UseCaseAbstraction.Interface {
  constructor(
    private identityContext: IdentityContext.Interface,
    private repository: CreateEntityRepository.Interface
  ) {}

  async execute(input: ICreateEntityInput): UseCaseAbstraction.Return {
    // Authorization checks (low-level approach; prefer createPermissions — see Schema-Based Permissions section).
    if (!this.identityContext.getPermission("mypackage.entity")) {
      return Result.fail(
        new NotAuthorizedError({
          message: "Not authorized to create entities!"
        })
      );
    }

    const entity = Entity.from({
      id: EntityId.from(input.id),
      values: {
        name: input.name,
        description: input.description || "(no description)",
        extensions: input.extensions ?? {},
        status: "disabled"
      }
    });

    // Create the entity.
    const result = await this.repository.execute(entity);
    if (result.isFail()) {
      return Result.fail(result.error);
    }

    return Result.ok(result.value);
  }
}

export default UseCaseAbstraction.createImplementation({
  implementation: CreateEntityUseCase,
  dependencies: [IdentityContext, CreateEntityRepository]
});
```

**Rules:**

- Class implements `UseCaseAbstraction.Interface`.
- Constructor params typed with `.Interface` from their abstractions.
- Return type uses `UseCaseAbstraction.Return`.
- Use `UseCaseAbstraction.createImplementation(...)` to wire up.
- `dependencies` array matches constructor parameter order exactly.
- Export as `default`.

---

## Repository Implementation (CMS as Storage)

Repositories use CMS use cases (`GetModelUseCase`, `CreateEntryUseCase`, `GetEntryByIdUseCase`, etc.) to persist data.

```typescript
// features/CreateEntity/CreateEntityRepository.ts
import { Entity, EntityValues } from "~/shared/Entity.js";
import { EntityCreationError, EntityModelNotFoundError } from "../../domain/errors.js";
import { CreateEntityRepository as RepositoryAbstraction } from "./abstractions.js";
import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import { ENTITY_MODEL_ID } from "~/shared/constants.js";

class CreateEntityRepository implements RepositoryAbstraction.Interface {
  constructor(
    private getModelUseCase: GetModelUseCase.Interface,
    private createEntryUseCase: CreateEntryUseCase.Interface
  ) {}

  async execute(entity: Entity): Promise<Result<Entity, RepositoryAbstraction.Error>> {
    // Get the model.
    const modelResult = await this.getModelUseCase.execute(ENTITY_MODEL_ID);
    if (modelResult.isFail()) {
      return Result.fail(new EntityModelNotFoundError());
    }

    // Create the entry.
    const createResult = await this.createEntryUseCase.execute(modelResult.value, {
      id: entity.id,
      values: {
        name: entity.values.name,
        status: entity.values.status,
        description: entity.values.description,
        extensions: entity.values.extensions || {}
      }
    });

    if (createResult.isFail()) {
      return Result.fail(new EntityCreationError(createResult.error));
    }

    return Result.ok(entity);
  }
}

export default RepositoryAbstraction.createImplementation({
  implementation: CreateEntityRepository,
  dependencies: [GetModelUseCase, CreateEntryUseCase]
});
```

**Common CMS use cases for repositories:**

- `GetModelUseCase` -- resolve CMS model by ID (always needed).
- `CreateEntryUseCase` -- create a new CMS entry.
- `GetEntryByIdUseCase` -- fetch entry by revision ID.
- `GetEntryUseCase` -- fetch entry by query (`where` + `sort`).
- `UpdateEntryUseCase` -- update an existing entry.
- `ListLatestEntriesUseCase` -- list latest entries.

**Import paths:**

```typescript
import { CreateEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { EntryId } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import { ListModelsUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
```

**Rules:**

- Always resolve the CMS model first via `GetModelUseCase`.
- Wrap CMS errors in domain-specific errors.
- Export as `default`.

---

## Feature Registration (`feature.ts`)

```typescript
// features/CreateEntity/feature.ts
import { createFeature } from "@webiny/feature/api";
import CreateEntityUseCase from "./CreateEntityUseCase.js";
import CreateEntityRepository from "./CreateEntityRepository.js";

export const CreateEntityFeature = createFeature({
  name: "CreateEntity",
  register(container) {
    // Register use case (transient scope).
    container.register(CreateEntityUseCase);

    // Register repository (singleton scope).
    container.register(CreateEntityRepository).inSingletonScope();
  }
});
```

**Rules:**

- Use cases: transient scope (default, no `.inSingletonScope()`).
- Repositories: singleton scope (`.inSingletonScope()`).
- Gateways: singleton scope (`.inSingletonScope()`).
- Features without a repository only register the use case.

---

## Public Exports (`index.ts`)

Each feature folder has an `index.ts` that exports only what external consumers need.

```typescript
// features/DisableEntity/index.ts
export {
  DisableEntityUseCase,
  EntityBeforeDisableEventHandler,
  EntityAfterDisableEventHandler
} from "./abstractions.js";
```

**Rules:**

- Export abstractions (use case, repository, event handler abstractions).
- Use `export { }` syntax, NOT `export *`.
- Do NOT export the feature (`feature.ts`).
- Do NOT export event classes (`events.ts`).
- Do NOT export implementation files.

---

## Root Extension (`Extension.ts`)

The top-level entry point that registers everything.

```typescript
// api/Extension.ts
import { createFeature } from "@webiny/feature/api";
import EntityModel from "./domain/EntityModel.js";
import { CreateEntityFeature } from "./features/CreateEntity/feature.js";
import { GetEntityByIdFeature } from "./features/GetEntityById/feature.js";
import { UpdateEntityFeature } from "./features/UpdateEntity/feature.js";
import CreateEntitySchema from "./graphql/CreateEntitySchema.js";
import GetEntitySchema from "./graphql/GetEntitySchema.js";

export const Extension = createFeature({
  name: "EntityManagement",
  register(container) {
    // CMS model.
    container.register(EntityModel);

    // GraphQL schemas.
    container.register(CreateEntitySchema);
    container.register(GetEntitySchema);

    // Features.
    CreateEntityFeature.register(container);
    GetEntityByIdFeature.register(container);
    UpdateEntityFeature.register(container);
  }
});
```

**Rules:**

- Register the CMS model first.
- Register GraphQL schemas with `container.register()`.
- Register features with `Feature.register(container)` (not `container.register(Feature)`).

---

## Domain: CMS Data Model (`EntityModel.ts`)

Define the CMS model schema using `ModelFactory`.

```typescript
// domain/EntityModel.ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { EntityModelExtension } from "./EntityModelExtension.js";
import { ENTITY_MODEL_ID } from "~/shared/constants.js";

class EntityModelFactory implements ModelFactory.Interface {
  constructor(private extensions: EntityModelExtension.Interface[]) {}

  async execute(builder: ModelFactory.Builder) {
    const model = builder
      .public({
        modelId: ENTITY_MODEL_ID,
        name: "Entity",
        group: "hidden"
      })
      .description("Manage entities.")
      .titleFieldId("name")
      .icon("fas/building")
      .singularApiName("Entity")
      .pluralApiName("Entities")
      .tags(["$publishing:false"]);

    model
      .fields(fields => ({
        name: fields
          .text()
          .label("Name")
          .description("Enter a name")
          .required()
          .renderer("text-input"),
        description: fields
          .longText()
          .label("Description")
          .description("Enter a description")
          .renderer("long-text-text-area")
          .required(),
        status: fields
          .text()
          .label("Status")
          .defaultValue("disabled")
          .renderer("hidden")
          .predefinedValues([
            { value: "enabled", label: "Enabled" },
            { value: "disabled", label: "Disabled" }
          ]),
        extensions: fields.object().renderer("passthrough")
      }))
      .layout([["name"], ["description"], ["extensions"]]);

    // Apply extensions from other packages.
    for (const modifier of this.extensions) {
      model.fields(fields => {
        const extensions = fields.extend().object();
        modifier.execute(extensions);
        return { extensions };
      });
    }

    return [model];
  }
}

export default ModelFactory.createImplementation({
  implementation: EntityModelFactory,
  dependencies: [[EntityModelExtension, { multiple: true }]]
});
```

**Key points:**

- Use `ModelFactory` from `@webiny/api-headless-cms/features/modelBuilder/index.js`.
- Use `.public()` for models accessible via API, or `.private()` for internal models.
- `group: "hidden"` hides the model from the CMS content model group list.
- `tags(["$publishing:false"])` disables entry publishing workflow.
- Extensions use `{ multiple: true }` dependency option to inject an array.

---

## Domain: Model Extension Abstraction

```typescript
// domain/EntityModelExtension.ts
import { createAbstraction } from "@webiny/feature/api";
import { IObjectFieldBuilder } from "@webiny/api-headless-cms/features/modelBuilder/fields/ObjectFieldType.js";

export type IExtension = Pick<IObjectFieldBuilder, "fields" | "layout">;

export interface IEntityModelExtension {
  execute(extension: IExtension): void;
}

export const EntityModelExtension =
  createAbstraction<IEntityModelExtension>("EntityModelExtension");

export namespace EntityModelExtension {
  export type Interface = IEntityModelExtension;
  export type Extension = IExtension;
}
```

---

## Domain: Error Definitions

```typescript
// domain/errors.ts
import { BaseError } from "@webiny/feature/api";

export class EntityNotFoundError extends BaseError {
  override readonly code = "Entity/NotFound" as const;

  constructor(id: string) {
    super({ message: `Entity with id "${id}" was not found!` });
  }
}

export class EntityModelNotFoundError extends BaseError {
  override readonly code = "Entity/ModelNotFound" as const;

  constructor() {
    super({ message: `Entity model was not found!` });
  }
}

export class EntityPersistenceError extends BaseError<{ error: Error }> {
  override readonly code = "Entity/Persist" as const;

  constructor(error: Error) {
    super({ message: error.message, data: { error } });
  }
}

export class EntityCreationError extends BaseError<{ error: Error }> {
  override readonly code = "Entity/Create" as const;

  constructor(error: Error) {
    super({ message: error.message, data: { error } });
  }
}
```

**Rules:**

- Extend `BaseError` from `@webiny/feature/api`.
- Use `override readonly code` with a namespaced string (`"Domain/ErrorType"`).
- If passing `data`, define a type and pass it as generic: `BaseError<TDataType>`.
- Use `as const` on the code for type narrowing.

---

## Domain: Entity ID Value Object

```typescript
// domain/EntityId.ts
import { EntryId } from "@webiny/api-headless-cms/exports/api/cms/entry.js";

export class EntityId {
  static from(id?: string) {
    if (id) {
      // Ensure clean id without revision suffix.
      return EntryId.from(id).id;
    }
    return EntryId.create().id;
  }
}
```

---

## Domain: Shared Entity Class

```typescript
// shared/Entity.ts
export interface EntityValues {
  name: string;
  description: string;
  status: "enabled" | "disabled";
  extensions: EntityExtensions;
}

export interface EntityExtensions {}

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

## Domain: Entry-to-Entity Mapper

When repositories return CMS entries, use a mapper to convert them to domain types. Mappers live in `features/shared/` or `~/domain/{entity}/`.

```typescript
// features/shared/EntryToEntityMapper.ts
import type { Entity, EntityDto, EntityValues } from "~/shared/Entity.js";
import { Entity as EntityClass } from "~/shared/Entity.js";

export class EntryToEntityMapper {
  static toEntity(entry: { entryId: string; values: EntityValues }): Entity {
    const dto: EntityDto = {
      id: entry.entryId,
      values: entry.values
    };

    return EntityClass.from(dto);
  }
}
```

**Rules:**

- Static methods only -- no instance state.
- Converts CMS entry shape (`{ entryId, values }`) to domain entity.
- Handle null/undefined values with defaults where appropriate.
- Used by repositories, not by use cases directly.

---

## GraphQL Schema

### Query Schema

```typescript
// graphql/GetCurrentEntitySchema.ts
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { GetCurrentEntityUseCase } from "../features/GetCurrentEntity/abstractions.js";

class GetCurrentEntitySchema implements GraphQLSchemaFactory.Interface {
  async execute(
    builder: GraphQLSchemaFactory.SchemaBuilder
  ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
    builder.addTypeDefs(/* GraphQL */ `
      type EntityResponse {
        data: Entity
        error: Error
      }

      type Entity {
        id: ID!
        values: JSON!
      }

      type MyPackageQuery {
        getCurrentEntity: EntityResponse
      }

      extend type Query {
        myPackage: MyPackageQuery
      }
    `);

    builder.addResolver({
      path: "Query.myPackage",
      resolver: () => {
        return () => ({});
      }
    });

    builder.addResolver({
      path: "MyPackageQuery.getCurrentEntity",
      dependencies: [GetCurrentEntityUseCase],
      resolver: (getEntity: GetCurrentEntityUseCase.Interface) => {
        return async () => {
          const result = await getEntity.execute();
          if (result.isFail()) {
            return new ErrorResponse(result.error);
          }
          return new Response(result.value);
        };
      }
    });

    return builder;
  }
}

export default GraphQLSchemaFactory.createImplementation({
  implementation: GetCurrentEntitySchema,
  dependencies: []
});
```

### Mutation Schema

```typescript
// graphql/DisableEntitySchema.ts
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { DisableEntityUseCase } from "../features/DisableEntity/abstractions.js";

class DisableEntitySchema implements GraphQLSchemaFactory.Interface {
  async execute(
    builder: GraphQLSchemaFactory.SchemaBuilder
  ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
    builder.addTypeDefs(/* GraphQL */ `
      extend type MyPackageMutation {
        disableEntity(entityId: ID!): BooleanResponse
      }
    `);

    builder.addResolver<{ entityId: string }>({
      path: "MyPackageMutation.disableEntity",
      dependencies: [DisableEntityUseCase],
      resolver: (disableEntity: DisableEntityUseCase.Interface) => {
        return async ({ args }) => {
          const result = await disableEntity.execute(args.entityId);
          if (result.isFail()) {
            return new ErrorResponse(result.error);
          }
          return new Response(true);
        };
      }
    });

    return builder;
  }
}

export default GraphQLSchemaFactory.createImplementation({
  implementation: DisableEntitySchema,
  dependencies: []
});
```

### Mutation Schema with Dynamic Input Fields

When GraphQL inputs must reflect CMS model fields (e.g., extensible "extensions" object):

```typescript
// graphql/CreateEntitySchema.ts
import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { Response } from "@webiny/handler-graphql";
import { ErrorResponse } from "@webiny/handler-graphql";
import { PluginsContainer } from "@webiny/api-headless-cms/legacy/abstractions.js";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields.js";
import { CreateEntityUseCase } from "../features/CreateEntity/abstractions.js";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { ENTITY_MODEL_ID } from "~/shared/constants.js";

class CreateEntitySchema implements GraphQLSchemaFactory.Interface {
  constructor(
    private pluginsContainer: PluginsContainer.Interface,
    private listModelsUseCase: ListModelsUseCase.Interface
  ) {}

  async execute(
    builder: GraphQLSchemaFactory.SchemaBuilder
  ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
    const inputCreateFields = await this.getExtensionsInput();

    builder.addTypeDefs(/* GraphQL */ `
            ${inputCreateFields.map(f => f.typeDefs).join("\n")}

            input CreateEntityInput {
                id: ID
                name: String!
                description: String
                ${inputCreateFields.map(f => f.fields).join("\n")}
            }
        `);

    builder.addTypeDefs(/* GraphQL */ `
      extend type MyPackageMutation {
        createEntity(input: CreateEntityInput!): BooleanResponse
      }
    `);

    builder.addResolver<{ input: CreateEntityUseCase.Input }>({
      path: "MyPackageMutation.createEntity",
      dependencies: [CreateEntityUseCase],
      resolver: (createEntity: CreateEntityUseCase.Interface) => {
        return async ({ args }) => {
          const result = await createEntity.execute(args.input);
          if (result.isFail()) {
            return new ErrorResponse(result.error);
          }
          return new Response(true);
        };
      }
    });

    return builder;
  }

  private async getExtensionsInput() {
    const fieldTypePlugins = createFieldTypePluginRecords(this.pluginsContainer);

    const modelsResult = await this.listModelsUseCase.execute({
      includePlugins: true,
      includePrivate: false
    });

    if (modelsResult.isFail()) {
      return [{ typeDefs: "", fields: "extensions: JSON" }];
    }

    const models = modelsResult.value;
    const model = models.find(m => m.modelId === ENTITY_MODEL_ID)!;

    return renderInputFields({
      models,
      model,
      fields: model.fields.filter(f => f.fieldId === "extensions"),
      fieldTypePlugins
    });
  }
}

export default GraphQLSchemaFactory.createImplementation({
  implementation: CreateEntitySchema,
  dependencies: [PluginsContainer, ListModelsUseCase]
});
```

**Rules:**

- Implement `GraphQLSchemaFactory.Interface`.
- Use `builder.addTypeDefs()` for schema definitions and `builder.addResolver()` for resolvers.
- Resolver `dependencies` array lists DI abstractions; resolver function receives resolved instances in same order.
- Type the resolver args generic: `builder.addResolver<{ input: UseCaseAbstraction.Input }>`.
- The root Query/Mutation types must define a namespace type (e.g., `MyPackageQuery`, `MyPackageMutation`) that is extended by individual schemas.
- One schema defines the base `MyPackageMutation` type + `extend type Mutation { myPackage: MyPackageMutation }`. Other schemas extend it.
- Use `Response` for success, `ErrorResponse` for failure.
- Export as `default`.

---

## Domain Events

### Event Payload Types (in `abstractions.ts`)

Event payload interfaces belong in `abstractions.ts` alongside the use case and repository abstractions. The handler abstractions also live here. The `events.ts` file only contains the event classes.

```typescript
// features/DisableEntity/abstractions.ts (append after use case abstraction)
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { Entity } from "~/shared/Entity.js";

// Event Payload Types
export interface EntityBeforeDisablePayload {
  entity: Entity;
}

export interface EntityAfterDisablePayload {
  entity: Entity;
}

// Event Handler Abstractions
export const EntityBeforeDisableEventHandler = createAbstraction<
  IEventHandler<EntityBeforeDisableEvent>
>("MyPackage/EntityBeforeDisableEventHandler");

export namespace EntityBeforeDisableEventHandler {
  export type Interface = IEventHandler<EntityBeforeDisableEvent>;
  export type Event = EntityBeforeDisableEvent;
}

export const EntityAfterDisableEventHandler = createAbstraction<
  IEventHandler<EntityAfterDisableEvent>
>("MyPackage/EntityAfterDisableEventHandler");

export namespace EntityAfterDisableEventHandler {
  export type Interface = IEventHandler<EntityAfterDisableEvent>;
  export type Event = EntityAfterDisableEvent;
}
```

### Event Definition (`events.ts`)

The event classes import payload types and handler abstractions from `abstractions.ts`.

```typescript
// features/DisableEntity/events.ts
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import {
  EntityBeforeDisableEventHandler,
  EntityAfterDisableEventHandler
} from "./abstractions.js";
import type {
  EntityBeforeDisablePayload,
  EntityAfterDisablePayload
} from "./abstractions.js";

export class EntityBeforeDisableEvent extends DomainEvent<EntityBeforeDisablePayload> {
  eventType = "entity.beforeDisable" as const;

  getHandlerAbstraction() {
    return EntityBeforeDisableEventHandler;
  }
}

export class EntityAfterDisableEvent extends DomainEvent<EntityAfterDisablePayload> {
  eventType = "entity.afterDisable" as const;

  getHandlerAbstraction() {
    return EntityAfterDisableEventHandler;
  }
}
```

### Publishing Events in a Use Case

```typescript
// features/DisableEntity/DisableEntityUseCase.ts
import { DisableEntityUseCase as UseCaseAbstraction } from "./abstractions.js";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { GetEntityByIdUseCase } from "../GetEntityById/abstractions.js";
import { UpdateEntityUseCase } from "../UpdateEntity/abstractions.js";
import { EntityBeforeDisableEvent, EntityAfterDisableEvent } from "./events.js";

class DisableEntityUseCase implements UseCaseAbstraction.Interface {
  constructor(
    private identityContext: IdentityContext.Interface,
    private eventPublisher: EventPublisher.Interface,
    private updateEntity: UpdateEntityUseCase.Interface,
    private getEntityById: GetEntityByIdUseCase.Interface
  ) {}

  async execute(entityId: string): Promise<Result<void, UseCaseAbstraction.Error>> {
    if (!this.identityContext.getPermission("mypackage.entity")) {
      return Result.fail(new NotAuthorizedError());
    }

    const getResult = await this.getEntityById.execute(entityId);
    if (getResult.isFail()) {
      return Result.fail(getResult.error);
    }

    const entity = getResult.value;

    // Publish before event.
    await this.eventPublisher.publish(new EntityBeforeDisableEvent({ entity }));

    // Perform the update.
    const updateResult = await this.updateEntity.execute(entityId, { status: "disabled" });
    if (updateResult.isFail()) {
      return Result.fail(updateResult.error);
    }

    // Publish after event.
    await this.eventPublisher.publish(new EntityAfterDisableEvent({ entity: updateResult.value }));

    return Result.ok();
  }
}

export default UseCaseAbstraction.createImplementation({
  implementation: DisableEntityUseCase,
  dependencies: [IdentityContext, EventPublisher, UpdateEntityUseCase, GetEntityByIdUseCase]
});
```

### Reacting to External Events (Event Handler)

```typescript
// features/DeleteEntityOnEntryDelete/DeleteEntityOnEntryDeleteHandler.ts
import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.js";
import { DeleteEntityUseCase } from "@webiny/api-core/features/tenancy/DeleteTenant";
import { ENTITY_MODEL_ID } from "~/shared/constants.js";

class DeleteEntityOnEntryDeleteHandler implements EntryAfterDeleteEventHandler.Interface {
  constructor(private deleteEntity: DeleteEntityUseCase.Interface) {}

  async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
    const { entry, model } = event.payload;

    // Only handle this model's deletions.
    if (model.modelId !== ENTITY_MODEL_ID) {
      return;
    }

    if (!event.payload.permanent) {
      return;
    }

    try {
      await this.deleteEntity.execute(entry.entryId);
    } catch (error) {
      console.error(`Failed to delete entity ${entry.entryId}!`, error);
    }
  }
}

export default EntryAfterDeleteEventHandler.createImplementation({
  implementation: DeleteEntityOnEntryDeleteHandler,
  dependencies: [DeleteEntityUseCase]
});
```

**Rules:**

- Events extend `DomainEvent<TPayload>`.
- `eventType` uses `"entity.beforeAction"` / `"entity.afterAction"` naming.
- Every event must implement `getHandlerAbstraction()` returning its handler abstraction.
- Every event handler abstraction must have a namespace with `Interface` and `Event` types.
- Publish before event, perform operation, then publish after event.
- When reacting to external events, use the external event's handler abstraction (e.g., `EntryAfterDeleteEventHandler.createImplementation`).

---

## Use Case Decorators

Decorators add cross-cutting concerns (authorization, logging, validation) without modifying the core use case.

### Decorator Implementation

```typescript
// features/GetEntityById/decorators/GetEntityByIdWithAuthorization.ts
import { GetEntityByIdUseCase } from "../abstractions.js";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";

class GetEntityByIdWithAuthorizationImpl implements GetEntityByIdUseCase.Interface {
  constructor(
    private identityContext: IdentityContext.Interface,
    private decoratee: GetEntityByIdUseCase.Interface
  ) {}

  async execute(id: string): GetEntityByIdUseCase.Return {
    if (!this.identityContext.getPermission("mypackage.entity")) {
      return Result.fail(new NotAuthorizedError());
    }

    return this.decoratee.execute(id);
  }
}

export const GetEntityByIdWithAuthorization = GetEntityByIdUseCase.createDecorator({
  decorator: GetEntityByIdWithAuthorizationImpl,
  dependencies: [IdentityContext]
});
```

### Registering a Decorator

```typescript
// features/GetEntityById/feature.ts
import { createFeature } from "@webiny/feature/api";
import GetEntityByIdUseCase from "./GetEntityByIdUseCase.js";
import GetEntityByIdRepository from "./GetEntityByIdRepository.js";
import { GetEntityByIdWithAuthorization } from "./decorators/GetEntityByIdWithAuthorization.js";

export const GetEntityByIdFeature = createFeature({
  name: "GetEntityById",
  register(container) {
    container.register(GetEntityByIdUseCase);
    container.register(GetEntityByIdRepository).inSingletonScope();
    container.registerDecorator(GetEntityByIdWithAuthorization);
  }
});
```

**Rules:**

- Implements the same interface as the use case it decorates.
- Constructor takes extra dependencies first, `decoratee` last.
- Call `this.decoratee.execute(...)` to delegate to the original use case.
- Can modify input before delegating, output after delegating, or short-circuit with an error.
- Use `UseCaseAbstraction.createDecorator(...)` to wire up. The `dependencies` array does NOT include the decoratee.
- Register with `container.registerDecorator()`, not `container.register()`.
- Return type uses `UseCaseAbstraction.Return`.

---

## Permission Transformer (Adding CMS Permissions)

When your package needs CMS access, implement a `PermissionTransformer`:

```typescript
// features/AddCmsPermissions/AddCmsPermissions.ts
import { PermissionTransformer } from "@webiny/api-core/features/security/authorization/AuthorizationContext/abstractions.js";

class AddCmsPermissions implements PermissionTransformer.Interface {
  execute(permission: PermissionTransformer.Permission) {
    if (permission.name !== "mypackage.*") {
      return permission;
    }

    return [
      permission,
      { name: "cms.endpoint.manage" },
      {
        name: "cms.contentModel",
        own: false,
        rwd: "r",
        pw: "",
        models: ["myEntityModelId"]
      },
      {
        name: "cms.contentModelGroup",
        own: false,
        rwd: "r",
        pw: "",
        groups: ["hidden"]
      },
      {
        name: "cms.contentEntry",
        own: false,
        rwd: "rwd",
        pw: ""
      }
    ];
  }
}

export default PermissionTransformer.createImplementation({
  implementation: AddCmsPermissions,
  dependencies: []
});
```

---

## Schema-Based Permissions (`createPermissions`)

Use `createPermissions` to define a typed permissions object from the same schema used by the admin UI. This replaces manual `identityContext.getPermission()` calls with high-level methods like `canRead`, `canCreate`, `canEdit`, `canDelete`, `canAccess`, `onlyOwnRecords`, `canPublish`, `canUnpublish`, and `canAction`.

### Defining Permissions (`permissions/schema.ts`)

```typescript
import { createPermissions } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";

const schema = {
  prefix: "fm",
  fullAccess: { name: "fm.*" },
  entities: [
    {
      id: "file",
      permission: "fm.file",
      scopes: ["full", "own"],
      actions: [{ name: "rwd" }]
    },
    {
      id: "settings",
      permission: "fm.settings",
      scopes: ["full"]
    }
  ]
} as const;

type FmSchema = typeof schema;

export const FmPermissions = createPermissions(schema);

export namespace FmPermissions {
  export type Interface = Permissions<FmSchema>;
}
```

`createPermissions` returns `{ Abstraction, Implementation }`. The `Abstraction` is a DI token; the `Implementation` is the auto-registered class. The namespace re-exports `Permissions<FmSchema>` as `.Interface` for consumers.

### Re-exporting from shared abstractions

```typescript
// features/shared/abstractions.ts
export { FmPermissions } from "~/permissions/schema.js";
```

### Using in a Use Case

Inject `FmPermissions.Abstraction` as a dependency. The resolved type is `FmPermissions.Interface`, which has typed entity IDs — only `"file"` and `"settings"` are accepted.

```typescript
import { FmPermissions } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

class ListFilesUseCaseImpl implements UseCaseAbstraction.Interface {
  constructor(
    private permissions: FmPermissions.Interface,
    private identityContext: IdentityContext.Interface,
    private repository: ListFilesRepository.Interface
  ) {}

  async execute(input: ListFilesInput) {
    // Gate: does the identity have read access to files at all?
    if (!(await this.permissions.canRead("file"))) {
      return Result.fail(new FileNotAuthorizedError());
    }

    const where: ListFilesInput["where"] = { ...(input.where || {}) };

    // Query filter: is this identity restricted to own records?
    if (await this.permissions.onlyOwnRecords("file")) {
      const identity = this.identityContext.getIdentity();
      where.createdBy = identity.id;
    }

    return this.repository.execute({ ...input, where });
  }
}

export const ListFilesUseCase = UseCaseAbstraction.createImplementation({
  implementation: ListFilesUseCaseImpl,
  dependencies: [FmPermissions.Abstraction, IdentityContext, ListFilesRepository]
});
```

### Available Methods

| Method | Signature | Purpose |
|---|---|---|
| `canAccess` | `(entityId, item?) → boolean` | Can the identity access this entity? If `item` is provided, checks ownership when scope is `own`. |
| `onlyOwnRecords` | `(entityId) → boolean` | Is the identity restricted to own records? Use for query-level filtering. |
| `canRead` | `(entityId) → boolean` | Has `r` in `rwd` (or full access). |
| `canCreate` | `(entityId) → boolean` | Has `w` in `rwd` (or full access). |
| `canEdit` | `(entityId, item?) → boolean` | Has `w` in `rwd`, respecting ownership. |
| `canDelete` | `(entityId, item?) → boolean` | Has `d` in `rwd`, respecting ownership. |
| `canPublish` | `(entityId) → boolean` | Has `p` in `pw`. |
| `canUnpublish` | `(entityId) → boolean` | Has `u` in `pw`. |
| `canAction` | `(action, entityId) → boolean` | Custom boolean action (e.g. `"import"`). |

All methods return `Promise<boolean>` and short-circuit to `true`/`false` for full-access identities.

### `canAccess` vs `onlyOwnRecords`

- **`canAccess(entityId, item?)`** — gate check. "Can this identity access this entity/item?" Use for single-item operations (get, update, delete). When `item` is provided and all permissions require `own`, verifies `item.createdBy.id === identity.id`.
- **`onlyOwnRecords(entityId)`** — query filter flag. "Is this identity restricted to own records?" Use for list operations to add a `createdBy` filter. Returns `false` for full access, schema full access, or no permissions; returns `true` only when every permission for the entity requires `own`.

---

## Scoping Rules

| Layer          | Scope                                 | Rationale                          |
| -------------- | ------------------------------------- | ---------------------------------- |
| UseCase        | Transient (default)                   | Fresh per invocation.              |
| Repository     | `.inSingletonScope()`                 | One cache instance.                |
| Gateway        | `.inSingletonScope()`                 | Stateless but expensive to create. |
| EventHandler   | Register normally (default transient) | Fresh per event.                   |
| CMS Model      | Register normally                     | Registered once at boot.           |
| GraphQL Schema | Register normally                     | Registered once at boot.           |

---

## Naming Conventions

| Artifact | Pattern | Example |
|---|---|---|
| Feature name | `{Action}{Entity}` | `GetFolder`, `CreatePage` |
| Use case | `{Action}{Entity}UseCase` | `CreateTenantUseCase` |
| Repository | `{Action}{Entity}Repository` | `CreateTenantRepository` |
| Event | `{Entity}{Before\|After}{Action}Event` | `TenantBeforeDisableEvent` |
| Handler | `{Entity}{Before\|After}{Action}EventHandler` | `TenantBeforeDisableEventHandler` |
| Decorator | `{Action}{Entity}With{Concern}` | `GetEntityByIdWithAuthorization` |
| Mapper | `EntryTo{Entity}Mapper` | `EntryToFolderMapper` |

---

## Code Conventions

- Use `createAbstraction` from `@webiny/feature/api` -- never `new Abstraction()`.
- All implementations use `createImplementation` with a `dependencies` array matching constructor order.
- Implementation classes are **not exported** -- only the `createImplementation` result (as `default`).
- One class per file. One named import per line.
- Use `.js` extensions in all relative imports.
- Use `~` alias for package-internal absolute imports.
- All operations return `Result<T, E>`. Check `result.isFail()` before `result.value`.
- Never return `null` -- use domain-specific NotFoundError.
- Wrap infrastructure errors in domain errors.

## Context

To discover existing system features, read `ai-context/core-features-reference.md`.

## Checklist

- [ ] Domain errors defined extending `BaseError` with `override readonly code`.
- [ ] Abstractions define error interfaces, union types, and namespaces with `Interface` + `Error`.
- [ ] Event payload types and handler abstractions defined in `abstractions.ts`, not `events.ts`.
- [ ] Use case implements abstraction `.Interface`, uses `createImplementation`.
- [ ] Repository implements abstraction `.Interface`, uses CMS use cases, wraps errors.
- [ ] Mapper used to convert CMS entries to domain types (if entity is complex).
- [ ] Feature registers use case (transient) and repository (singleton).
- [ ] Decorators registered with `container.registerDecorator()`, decoratee is last constructor param.
- [ ] Root Extension registers model, schemas, and features.
- [ ] GraphQL schema implements `GraphQLSchemaFactory.Interface`.
- [ ] Domain events have handler abstractions with `Interface` + `Event` namespace.
- [ ] Permissions use `createPermissions` with a schema matching the admin UI, not raw `getPermission()`.
- [ ] `index.ts` exports abstractions only -- no features, no event classes, no implementations.
- [ ] All relative imports use `.js` extension.
- [ ] One class per file, one import per line.
