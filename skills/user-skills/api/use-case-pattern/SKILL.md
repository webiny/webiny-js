---
name: webiny-use-case-pattern
context: webiny-api
description: >
  UseCase implementation pattern — DI, Result handling, error types, decorators, CMS repositories,
  entry mappers, and schema-based permissions. Use this skill to implement, inject, override, or
  decorate any Webiny UseCase, or to build repositories that persist data via CMS.
---

# UseCase Pattern

## What It Is

A **UseCase** is a single-method orchestrator that encapsulates one business operation (e.g., `CreateTenantUseCase`, `PublishEntryUseCase`). Each UseCase is a DI abstraction with an `execute` method that returns `Result<T, E>`.

## Interface Shape

```ts
interface SomeUseCase.Interface {
    execute(input: Input): Promise<Result<ReturnType, ErrorType>>;
}
```

- **Input** — a typed object specific to the use case
- **Result** — always returns `Result<T, E>` from `@webiny/feature/api`
- **Error** — extends `BaseError` with a unique `code`

## How to Use a UseCase

UseCases are injected as dependencies into EventHandlers, other UseCases, or GraphQL resolvers via DI.

```ts
import { SomeUseCase } from "webiny/api/<category>";
import { SomeEventHandler } from "webiny/api/<category>";

class MyHandler implements SomeEventHandler.Interface {
    constructor(private someUseCase: SomeUseCase.Interface) {}

    async handle(event: SomeEventHandler.Event) {
        const result = await this.someUseCase.execute({ /* input */ });

        if (result.isFail()) {
            console.error(result.error.message);
            return;
        }

        const value = result.value;
        // ... use value
    }
}

export default SomeEventHandler.createImplementation({
    implementation: MyHandler,
    dependencies: [SomeUseCase]
});
```

## How to Override a UseCase

To replace the default implementation, register your own:

```ts
import { SomeUseCase } from "webiny/api/<category>";

class CustomImplementation implements SomeUseCase.Interface {
    async execute(input) {
        // Custom logic
        return Result.ok(/* ... */);
    }
}

export default SomeUseCase.createImplementation({
    implementation: CustomImplementation,
    dependencies: []
});
```

## Registration

**YOU MUST include the full file path with the `.ts` extension in the `src` prop.** For example, use `src={"@/extensions/my-extension.ts"}`, NOT `src={"@/extensions/my-extension"}`. Omitting the file extension will cause a build failure.

**YOU MUST use `export default` for the `createImplementation()` call** when the file is targeted directly by an Extension `src` prop. Using a named export (`export const Foo = SomeFactory.createImplementation(...)`) will cause a build failure. Named exports are only valid inside files registered via `createFeature`.

```tsx
// In your app's configuration
<Api.Extension src={"@/extensions/my-extension.ts"} />
```

Deploy with: `yarn webiny deploy api --env=dev`

---

## Error Handling Pattern

### Domain-Specific Errors

Every feature defines errors extending `BaseError`. Never use generic `Error` for validation or business rule failures.

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

export class EntityValidationError extends BaseError<{ message: string }> {
    override readonly code = "Entity/Validation" as const;
    constructor(message: string) {
        super({ message, data: { message } });
    }
}
```

### Typed Error Unions in Abstractions

Define an `IErrors` interface mapping error names to types, then create a union via `[keyof IErrors]`:

```ts
// features/createEntity/abstractions.ts
import { createAbstraction, Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { EntityPersistenceError, EntityModelNotFoundError, EntityCreationError } from "~/api/domain/errors.js";

// REPOSITORY errors
export interface ICreateEntityRepositoryErrors {
    persistence: EntityPersistenceError;
    modelNotFound: EntityModelNotFoundError;
    creation: EntityCreationError;
}

type RepositoryError = ICreateEntityRepositoryErrors[keyof ICreateEntityRepositoryErrors];

export interface ICreateEntityRepository {
    execute(entity: Entity): Promise<Result<Entity, RepositoryError>>;
}

export const CreateEntityRepository = createAbstraction<ICreateEntityRepository>(
    "MyExt/CreateEntityRepository"
);

export namespace CreateEntityRepository {
    export type Interface = ICreateEntityRepository;
    export type Error = RepositoryError;
    export type Return = Promise<Result<Entity, RepositoryError>>;
}

// USE CASE errors — superset of repository errors
export interface ICreateEntityUseCaseErrors {
    persistence: EntityPersistenceError;
    modelNotFound: EntityModelNotFoundError;
    creation: EntityCreationError;
    notAuthorized: NotAuthorizedError;
}

type UseCaseError = ICreateEntityUseCaseErrors[keyof ICreateEntityUseCaseErrors];

export interface ICreateEntityUseCase {
    execute(input: CreateEntityInput): Promise<Result<Entity, UseCaseError>>;
}

export const CreateEntityUseCase = createAbstraction<ICreateEntityUseCase>(
    "MyExt/CreateEntityUseCase"
);

export namespace CreateEntityUseCase {
    export type Interface = ICreateEntityUseCase;
    export type Input = CreateEntityInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Entity, UseCaseError>>;
}
```

### Result Pattern

```ts
// Success
return Result.ok(value);

// Failure
return Result.fail(new EntityNotFoundError(id));

// Check result
if (result.isFail()) {
    return Result.fail(result.error);
}

// Access value
const value = result.value;
```

Never use `result.isError()`, `result.getError()`, or `result.getValue()` — these do not exist.

---

## UseCase Implementation

```ts
// features/createEntity/CreateEntityUseCase.ts
import { CreateEntityUseCase as UseCaseAbstraction, CreateEntityRepository } from "./abstractions.js";
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

    async execute(input: UseCaseAbstraction.Input): UseCaseAbstraction.Return {
        if (!this.identityContext.getPermission("mypackage.entity")) {
            return Result.fail(new NotAuthorizedError({ message: "Not authorized to create entities!" }));
        }

        const entity = Entity.from({
            id: EntityId.from(input.id),
            values: { name: input.name, status: "disabled" }
        });

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
- Class implements `UseCaseAbstraction.Interface`
- Constructor params typed with `.Interface` from their abstractions
- Return type uses `UseCaseAbstraction.Return`
- `dependencies` array matches constructor parameter order exactly
- Export as `default`

---

## CMS Repository Pattern

Repositories use CMS use cases to persist data. Always resolve the CMS model first.

```ts
// features/createEntity/CreateEntityRepository.ts
import { Entity } from "~/shared/Entity.js";
import { EntityCreationError, EntityModelNotFoundError } from "~/api/domain/errors.js";
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

    async execute(entity: Entity): RepositoryAbstraction.Return {
        const modelResult = await this.getModelUseCase.execute(ENTITY_MODEL_ID);
        if (modelResult.isFail()) {
            return Result.fail(new EntityModelNotFoundError());
        }

        const createResult = await this.createEntryUseCase.execute(modelResult.value, {
            id: entity.id,
            values: {
                name: entity.values.name,
                status: entity.values.status
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

### Common CMS Use Cases for Repositories

```ts
import { CreateEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { EntryId } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model";
import { ListModelsUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
```

**Rules:**
- Always resolve the CMS model first via `GetModelUseCase`
- Wrap CMS errors in domain-specific errors
- Register repositories in **singleton scope**
- Export as `default`

---

## Entry-to-Entity Mapper

When repositories return CMS entries, use a mapper to convert to domain types:

```ts
// features/shared/EntryToEntityMapper.ts
import { Entity as EntityClass } from "~/shared/Entity.js";
import type { Entity, EntityDto, EntityValues } from "~/shared/Entity.js";

export class EntryToEntityMapper {
    static toEntity(entry: { entryId: string; values: EntityValues }): Entity {
        return EntityClass.from({
            id: entry.entryId,
            values: entry.values
        });
    }
}
```

- Static methods only — no instance state
- Used by repositories, not by use cases directly
- Handle null/undefined values with defaults where appropriate

---

## UseCase Decorators

Decorators add cross-cutting concerns (authorization, logging, validation) without modifying the core use case.

```ts
// features/getEntityById/decorators/GetEntityByIdWithAuthorization.ts
import { GetEntityByIdUseCase } from "../abstractions.js";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";

class GetEntityByIdWithAuthorizationImpl implements GetEntityByIdUseCase.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private decoratee: GetEntityByIdUseCase.Interface  // decoratee is LAST
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
    dependencies: [IdentityContext]  // does NOT include decoratee
});
```

### Registering a Decorator

```ts
// features/getEntityById/feature.ts
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
- Implements the same interface as the use case it decorates
- Constructor: extra dependencies first, `decoratee` **last**
- Use `UseCaseAbstraction.createDecorator(...)` — the `dependencies` array does NOT include the decoratee
- Register with `container.registerDecorator()`, not `container.register()`
- Can modify input before delegating, output after, or short-circuit with an error

---

## Schema-Based Permissions

For implementing authorization in use cases, see the **webiny-api-permissions** skill. It covers:
- Permission schema definition with `createPermissions`
- All permission methods (`canRead`, `canEdit`, `canDelete`, `canPublish`, `onlyOwnRecords`, etc.)
- Use case patterns for every CRUD operation (get, list, update, delete, publish)
- Own-record scoping and item-level ownership checks
- Testing patterns and permission object shapes

---

## Resolving Types (MANDATORY)

**Before writing any code that calls a UseCase or accesses its return types, you MUST read the source file listed in the catalog's `Source` field to verify the exact method signatures, input parameters, return types, and error types. Do not assume or guess property names from memory.**

1. Read the `abstractions.ts` file from the catalog `Source` path
2. If the interface references domain types, follow the import and read that type declaration
3. Only use properties and method signatures confirmed in the source

## Key Rules

- Always check `result.isFail()` before accessing `.value` or `.error`
- DI constructor parameter order must match the `dependencies` array order exactly
- Use `.js` extensions in import paths (ES modules)

## Related Skills

- **webiny-api-architect** — Architecture overview, Services vs UseCases, feature naming, anti-patterns
- **webiny-api-permissions** — Schema-based permissions, CRUD authorization patterns, testing
- **webiny-event-handler-pattern** — EventHandler lifecycle, domain event publishing
- **webiny-custom-graphql-api** — GraphQL schema creation with UseCase DI
- **webiny-dependency-injection** — Injectable services catalog
