# Backend Developer Guide: Clean Architecture, Feature Based

This guide combines the DI container patterns with Clean Architecture principles for building scalable, testable features.

## Architecture Philosophy

Our architecture combines:

- **Clean Architecture**: Layered separation with dependency inversion
- **Domain-Driven Design**: Rich domain models and business rules
- **Vertical Slices**: Feature-based organization
- **DI Container**: Type-safe dependency injection

## Layered Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Application                        │
│        (Use Cases, Repository Interfaces)           │
└──────────────────┬──────────────────────────────────┘
                   │ depends on
┌──────────────────▼──────────────────────────────────┐
│                    Domain                           │
│      (Entities, Value Objects, Domain Services)     │
└──────────────────┬──────────────────────────────────┘
                   │ used by
┌──────────────────▼──────────────────────────────────┐
│               Infrastructure                        │
│    (Gateways, Mappers, Concrete Implementations)    │
└─────────────────────────────────────────────────────┘
```

**Key principle:** Dependencies point inward. Inner layers never depend on outer layers.

## Folder Structure

When developing a feature, YOU MUST follow this file organization.

```text
src/
├── features/                        # Vertical slices (one per use case)
│   ├── GetUser/
│   │   ├── feature.ts              # Feature definition (DI registration)
│   │   ├── abstractions.ts         # DI abstractions/tokens
│   │   ├── GetUserUseCase.ts       # Application service (orchestration)
│   │   ├── GetUserRepository.ts    # Repository implementation (OPTIONAL)
│   │   ├── GetUserGateway.ts       # Infrastructure (API calls) (OPTIONAL)
│   │   ├── GetUserMapper.ts        # DTO ↔ Domain mapping (OPTIONAL)
│   │   ├── types.ts                # Input/Output DTOs (OPTIONAL)
│   │   └── __tests__/
│   │       └── GetUserUseCase.test.ts
```

## Creating a feature

Features encapsulate complete vertical slices of functionality.

**Feature Definition:**

The following code snippet demonstrates what `createFeature` does internally.
In regular code, you import it as `import { createFeature } from "@webiny/feature";`

```typescript
import type { Container } from "@webiny/di";

export interface FeatureDefinition<TExports = any> {
  name: string;
  register(container: Container): void;
}

export function createFeature<TExports = any>(def: {
  name: string;
  register(container: Container): void;
}): FeatureDefinition<TExports> {
  const registeredContainers = new WeakSet<Container>();

  return {
    name: def.name,
    register: (container: Container) => {
      if (!registeredContainers.has(container)) {
        def.register(container);
        registeredContainers.add(container);
      }
    }
  };
}
```

**Abstraction Definition:**

Every feature starts with an abstraction definition. There can be one or more abstractions. You need to create an abstraction for every meaningful part of the feature: use case, repository, event, etc.

Here's an example definition of an abstraction for a use case.

```typescript
// abstractions.ts
import { createAbstraction } from "@webiny/feature/api";

interface IUpdateUserUseCase {
  execute(id: string, data: Record<string, any>): Promise<void>;
}

export const UpdateUserUseCase = createAbstraction<IUpdateUserUseCase>("UpdateUserUseCase");

export namespace UpdateUserUseCase {
  export type Interface = IUpdateUserUseCase;
}
```

You MUST ALWAYS use `createAbstraction` instead of `new Abstraction`.

**Use case implementation**

**CRITICAL RULES:**
1. Use case class MUST implement the abstraction's `.Interface` type
2. Use case method return types MUST use the abstraction's `.Error` namespace type
3. Constructor parameters MUST use `.Interface` types from their abstractions
4. Always use `createImplementation` to wire up the use case

```typescript
// UpdateUserUseCase.ts
import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";

// Import abstraction you're implementing
import { UpdateUserUseCase as UseCaseAbstraction } from "./abstractions.js";

// Import abstractions you want to depend on
import { SupportedLanguagesProvider } from "@webiny/some-package/features/SupportedLanguagesProvider";
import { UserRepository } from "../shared/abstractions.js";

// Implementation class MUST implement the abstraction's Interface
export class UpdateUserUseCase implements UseCaseAbstraction.Interface {
  private provider: SupportedLanguagesProvider.Interface;
  private repository: UserRepository.Interface;

  // Constructor parameters MUST use .Interface types
  constructor(
    provider: SupportedLanguagesProvider.Interface,
    repository: UserRepository.Interface
  ) {
    this.provider = provider;
    this.repository = repository;
  }

  // Return type MUST use the abstraction's .Error namespace type
  async execute(id: string, data: Record<string, any>): Promise<Result<void, UseCaseAbstraction.Error>> {
    // Implementation goes here
    const result = await this.repository.update(id, data);
    if (result.isFail()) {
      return Result.fail(result.error);
    }

    return Result.ok();
  }
}

// Wire up with createImplementation
export const UpdateUserUseCaseImpl = createImplementation({
  abstraction: UseCaseAbstraction,
  implementation: UpdateUserUseCase,
  dependencies: [SupportedLanguagesProvider, UserRepository]
});
```

## Use Case Decorators

Decorators add cross-cutting concerns to use cases without modifying the core logic.

**Common decorator patterns:**

1. **Validation** - Validate input earliest
2. **Authorization** - Check permissions
3. **Mutation** - Transform input (e.g., add defaults)
4. **Metrics** - Track execution time/errors

**Decorator Example:**

```typescript
// features/pages/CreatePage/decorators/ValidationDecorator.ts
import { createDecorator } from "@webiny/feature";
import { CreatePageUseCase } from "../abstractions";

class CreatePageValidationDecoratorImpl {
  constructor(private decoratee: CreatePageUseCase.Interface) {}

  async execute(input: CreatePageInput): Promise<Page> {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error("Title is required");
    }

    if (input.title.length > 200) {
      throw new Error("Title must be less than 200 characters");
    }

    return this.decoratee.execute(input);
  }
}

export const CreatePageValidationDecorator = createDecorator({
  abstraction: CreatePageUseCase,
  decorator: CreatePageValidationDecoratorImpl,
  dependencies: []
});
```

### 4. Feature Composition

Build complex features from simple ones:

```typescript
// features/UserManagement/feature.ts
export const UserManagementFeature = createFeature({
  name: "UserManagement",
  register(container) {
    // Register sub-features
    GetUserFeature.register(container);
    UpdateUserFeature.register(container);
    DeleteUserFeature.register(container);
    ListUsersFeature.register(container);

    // Register presenters that compose use cases
    container.register(UserListUseCaseImpl);
  }
});
```

ALWAYS register use cases in transient scope (default).
ALWAYS register repositories in singleton scope.

## Error Handling Pattern

Every feature should define domain-specific errors that extend `BaseError` from `@webiny/feature/api`.

### Error Definition Pattern

Create a `shared/errors.ts` file in your feature with domain-specific errors:

```typescript
// features/apiKeys/shared/errors.ts
import { BaseError } from "@webiny/feature/api";

// Wrap storage/infrastructure errors
export class ApiKeyStorageError extends BaseError {
    override readonly code = "API_KEY_STORAGE_ERROR" as const;

    constructor(error: Error) {
        super({
            message: error.message,
            data: {}
        });
    }
}

// Domain-specific not found error
export class ApiKeyNotFoundError extends BaseError {
    override readonly code = "API_KEY_NOT_FOUND" as const;

    constructor() {
        super({
            message: `API key was not found!`,
            data: {}
        });
    }
}

// Authorization error with optional message
type NotAuthorizedErrorData = {
    message?: string;
};

export class NotAuthorizedError extends BaseError<NotAuthorizedErrorData> {
    override readonly code = "NOT_AUTHORIZED" as const;

    constructor(data: NotAuthorizedErrorData = {}) {
        super({
            message: data.message || "Not authorized to perform this action",
            data
        });
    }
}
```

### Typed Error Unions in Abstractions

Define error unions in your abstraction files to provide type safety:

```typescript
// features/apiKeys/shared/abstractions.ts
import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ApiKeyNotFoundError, ApiKeyStorageError } from "./errors.js";

// Define possible errors for this repository
export interface IApiKeysRepositoryErrors {
    base: ApiKeyNotFoundError | ApiKeyStorageError;
}

// Create error union type
type RepositoryError = IApiKeysRepositoryErrors[keyof IApiKeysRepositoryErrors];

// Use in interface
export interface IApiKeysRepository {
    get(id: string): Promise<Result<ApiKey, RepositoryError>>;
    create(data: ApiKey): Promise<Result<void, RepositoryError>>;
}

export const ApiKeysRepository = createAbstraction<IApiKeysRepository>("ApiKeysRepository");

export namespace ApiKeysRepository {
    export type Interface = IApiKeysRepository;
    export type Error = RepositoryError; // Export for consumers
}
```

### Using Typed Errors in Repository

```typescript
// features/apiKeys/shared/ApiKeysRepository.ts
import { Result } from "@webiny/feature/api";
import { ApiKeysRepository as RepositoryAbstraction } from "./abstractions.js";
import { ApiKeyNotFoundError, ApiKeyStorageError } from "./errors.js";

class ApiKeysRepositoryImpl implements RepositoryAbstraction.Interface {
    async get(id: string): Promise<Result<ApiKey, RepositoryAbstraction.Error>> {
        try {
            const apiKey = await this.storageOperations.getApiKey({ id });
            if (apiKey) {
                return Result.ok(apiKey);
            }
            // Return domain-specific error
            return Result.fail(new ApiKeyNotFoundError());
        } catch (error) {
            // Wrap infrastructure errors
            return Result.fail(new ApiKeyStorageError(error as Error));
        }
    }
}
```

### Error Handling Benefits

This pattern provides:
- **Type safety** - Consumers know exactly which errors can occur
- **Domain context** - Specific error codes and messages
- **Consistent wrapping** - Infrastructure errors wrapped in domain errors
- **Better error handling** - Consumers can handle specific error types

### Use Case Error Handling Pattern

**CRITICAL:** Use cases MUST extend repository errors with their own use-case-specific errors.

Every use case abstraction must define:
1. An extendable error interface for use-case-specific errors
2. A union type combining use-case errors with repository errors
3. An exported error type in the namespace

```typescript
// features/apiKeys/CreateApiKey/abstractions.ts
import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { NotAuthorizedError, ApiKeyValidationError } from "../shared/errors.js";

// 1. Define extendable interface for use-case-specific errors
export interface ICreateApiKeyErrors {
    notAuthorized: NotAuthorizedError;
    validation: ApiKeyValidationError;
}

// 2. Create union of use-case errors + repository errors
type CreateApiKeyError = ICreateApiKeyErrors[keyof ICreateApiKeyErrors] | ApiKeysRepository.Error;

// 3. Use in interface
export interface ICreateApiKey {
    execute(input: CreateApiKeyInput): Promise<Result<ApiKey, CreateApiKeyError>>;
}

export const CreateApiKey = createAbstraction<ICreateApiKey>("CreateApiKey");

// 4. Export error type in namespace
export namespace CreateApiKey {
    export type Interface = ICreateApiKey;
    export type Error = CreateApiKeyError; // Consumers can use CreateApiKey.Error
}
```

This pattern ensures:
- All repository errors (storage, not found, etc.) are automatically included
- Use case can add its own specific errors (validation, authorization, business rules)
- Type safety throughout the error handling chain
- Clear documentation of all possible errors

**Use Case Implementation:**

```typescript
// features/apiKeys/CreateApiKey/CreateApiKeyUseCase.ts
import { CreateApiKey } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import { NotAuthorizedError, ApiKeyValidationError } from "../shared/errors.js";

class CreateApiKeyUseCaseImpl implements CreateApiKey.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: ApiKeysRepository.Interface
    ) {}

    async execute(input: CreateApiKeyInput): Promise<Result<ApiKey, CreateApiKey.Error>> {
        // Use-case specific error
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        // Validation error
        if (!validation.success) {
            return Result.fail(new ApiKeyValidationError(validation.error.message));
        }

        // Repository errors are automatically included in CreateApiKey.Error
        const result = await this.repository.create(apiKey);
        if (result.isFail()) {
            return Result.fail(result.error); // Could be ApiKeyStorageError
        }

        return Result.ok(result.value);
    }
}
```

### Result Pattern

Always use `Result<T, E>` for operations that can fail:

```typescript
// Success
return Result.ok(value);

// Failure
return Result.fail(new DomainSpecificError());

// Check result
if (result.isFail()) {
    return Result.fail(result.error);
}

// Access value
const value = result.value;
```

Never use `result.isError()`, `result.getError()`, or `result.getValue()` - these are incorrect patterns.

### Validation Errors

**NEVER use generic `Error` for validation failures.** Always create domain-specific validation errors:

```typescript
// shared/errors.ts
export class ApiKeyValidationError extends BaseError<{ message: string }> {
    override readonly code = "API_KEY_VALIDATION_ERROR" as const;

    constructor(message: string) {
        super({
            message,
            data: { message }
        });
    }
}

// In use case
const validation = schema.safeParse(input);
if (!validation.success) {
    return Result.fail(new ApiKeyValidationError(validation.error.errors[0].message));
}
```

This ensures error codes are identifiable in API responses and logs.

## Domain Events Pattern

Domain events notify the system when important domain actions occur. Every event MUST have a corresponding handler abstraction.

### Event Definition Pattern

Events must follow this structure with handler abstractions:

```typescript
// features/teams/CreateTeam/events.ts
import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";
import type { TeamBeforeCreatePayload, TeamAfterCreatePayload } from "./abstractions.js";

// Before event with handler abstraction
export class TeamBeforeCreateEvent extends DomainEvent<TeamBeforeCreatePayload> {
    eventType = "team.beforeCreate" as const;

    getHandlerAbstraction() {
        return TeamBeforeCreateHandler;
    }
}

export const TeamBeforeCreateHandler = createAbstraction<IEventHandler<TeamBeforeCreateEvent>>(
    "TeamBeforeCreateHandler"
);

export namespace TeamBeforeCreateHandler {
    export type Interface = IEventHandler<TeamBeforeCreateEvent>;
    export type Event = TeamBeforeCreateEvent;
}

// After event with handler abstraction
export class TeamAfterCreateEvent extends DomainEvent<TeamAfterCreatePayload> {
    eventType = "team.afterCreate" as const;

    getHandlerAbstraction() {
        return TeamAfterCreateHandler;
    }
}

export const TeamAfterCreateHandler = createAbstraction<IEventHandler<TeamAfterCreateEvent>>(
    "TeamAfterCreateHandler"
);

export namespace TeamAfterCreateHandler {
    export type Interface = IEventHandler<TeamAfterCreateEvent>;
    export type Event = TeamAfterCreateEvent;
}
```

### Event Payload Definition

Define event payloads in the abstraction file:

```typescript
// features/teams/CreateTeam/abstractions.ts
export interface TeamBeforeCreatePayload {
    team: Team;
    input: CreateTeamInput;
}

export interface TeamAfterCreatePayload {
    team: Team;
    input: CreateTeamInput;
}
```

### Publishing Events

Publish events from use cases using EventPublisher:

```typescript
// features/teams/CreateTeam/CreateTeamUseCase.ts
import { EventPublisher } from "@webiny/api-core";
import { TeamBeforeCreateEvent, TeamAfterCreateEvent } from "./events.js";

class CreateTeamUseCaseImpl implements CreateTeam.Interface {
    constructor(
        private eventPublisher: EventPublisher.Interface,
        private repository: TeamsRepository.Interface
    ) {}

    async execute(input: CreateTeamInput): Promise<Result<Team, CreateTeam.Error>> {
        const team = createTeamFromInput(input);

        // Publish before event
        await this.eventPublisher.publish(
            new TeamBeforeCreateEvent({ team, input })
        );

        const result = await this.repository.create(team);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        // Publish after event
        await this.eventPublisher.publish(
            new TeamAfterCreateEvent({ team, input })
        );

        return Result.ok(team);
    }
}
```

### Event Naming Convention

Follow these naming conventions:
- Event types use `entityName.action` format (e.g., `"team.beforeCreate"`, `"team.afterUpdate"`)
- Handler abstractions use `EntityActionHandler` format (e.g., `TeamBeforeCreateHandler`)
- Event classes use `EntityActionEvent` format (e.g., `TeamBeforeCreateEvent`)

**Critical Rules:**
1. **ALWAYS create handler abstractions** - Every event must have a `createAbstraction` for its handler
2. **Use `eventType` property** - Not `static type`
3. **Implement `getHandlerAbstraction()`** - This method returns the handler abstraction
4. **Export handler abstractions** - So consumers can register event handlers in the DI container
5. **ALWAYS export namespace with Interface and Event types** - Every handler abstraction MUST export a namespace containing both the Interface type and the Event class

**Example of correct namespace export:**
```typescript
export const TeamBeforeCreateHandler = createAbstraction<IEventHandler<TeamBeforeCreateEvent>>(
    "TeamBeforeCreateHandler"
);

export namespace TeamBeforeCreateHandler {
    export type Interface = IEventHandler<TeamBeforeCreateEvent>;
    export type Event = TeamBeforeCreateEvent;
}
```

This namespace pattern enables:
- Type-safe access to handler interface via `TeamBeforeCreateHandler.Interface`
- Type-safe access to event class via `TeamBeforeCreateHandler.Event`
- Proper event handler registration in DI container
- Clear coupling between events and their handlers

This pattern enables:
- Type-safe event handling with DI
- Decoupled event producers and consumers
- Testable event handlers
- Clear event contracts

## Public API Design

Export only what external consumers need:

```typescript
// index.ts - Public API
export { UserManagementFeature } from "./features/UserManagement";

// Export abstractions for DI
export { UserRepository, UserCache } from "./features/UserManagement/abstractions";

// Export domain objects
export { User, UserRole } from "./domain/user";

// Export types
export type { CreateUserInput, UpdateUserInput } from "./features/UserManagement/types";

// DO NOT export internal implementations
// ❌ export { UserRepositoryImpl } from "./features/UserManagement/UserRepository";
// ❌ export { UserGateway } from "./features/UserManagement/UserGateway";
```

## Summary Checklist

When building a new feature, follow this checklist:

- [ ] **Define domain objects** (entities, value objects, domain services)
- [ ] **Create use case** (application layer workflow)
- [ ] **Define repository interface** (application layer contract)
- [ ] **Implement gateway** (infrastructure layer I/O)
- [ ] **Implement mapper** (DTO ↔ Domain conversion)
- [ ] **Implement repository** (infrastructure layer, uses gateway)
- [ ] **Create abstractions.ts** (DI tokens)
- [ ] **Create feature.ts** (DI registration)
- [ ] **Write tests** (unit tests for each layer)
- [ ] **Export public API** (index.ts)
- [ ] **Register decorators** (if needed for cross-cutting concerns)

This architecture provides a scalable foundation for building complex applications while maintaining clear separation of concerns, testability, and flexibility.
