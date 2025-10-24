# Migration Plan: api-admin-users Package

## Overview

This document outlines the migration plan for `packages/api-admin-users/src` to follow the new development standard based on Clean Architecture, DDD, and the DI container pattern.

**Reference Implementation:** `packages/api-security/src/features/groups`

---

## Current State Analysis

### Current Structure
```
api-admin-users/src/
├── createAdminUsers.ts           # Main factory function (342 lines)
├── createExternalIdpAdminUserHooks.ts
├── types.ts                      # All types/interfaces (270 lines)
├── index.ts                      # Entry point
├── graphql/
│   ├── base.gql.ts
│   └── user.gql.ts              # GraphQL schema (187 lines)
└── createAdminUsers/
    ├── users.loaders.ts          # DataLoader implementation
    └── users.validation.ts       # Validation hooks
```

### Current Functionality
The package currently provides:
1. **User Management CRUD**:
   - `createUser` - Creates a new admin user
   - `getUser` - Gets a single user by ID or email
   - `listUsers` - Lists all users with filtering
   - `updateUser` - Updates an existing user
   - `deleteUser` - Deletes a user
   - `isEmailTaken` - Checks email uniqueness
   - `listUserTeams` - Gets teams for a user

2. **Event System** (using PubSub topics):
   - `onUserBeforeCreate`, `onUserAfterCreate`
   - `onUserBeforeUpdate`, `onUserAfterUpdate`
   - `onUserBeforeDelete`, `onUserAfterDelete`
   - `onUserCreateError`, `onUserUpdateError`, `onUserDeleteError`

3. **Integration Points**:
   - Security context (permission checking)
   - Tenancy context
   - WCP seats management (increment/decrement)
   - DataLoader for efficient querying
   - Storage operations abstraction

### Current Patterns (Old Style)
- ❌ Factory function pattern (`createAdminUsers`)
- ❌ Context plugin registration
- ❌ PubSub topics for events
- ❌ Direct storage operations
- ❌ No Result monad pattern
- ❌ No typed error handling
- ❌ GraphQL resolvers in same package

---

## Target Architecture

### New Structure
```
api-admin-users/src/
├── features/
│   ├── users/
│   │   ├── CreateUser/
│   │   │   ├── CreateUserUseCase.ts
│   │   │   ├── abstractions.ts
│   │   │   ├── events.ts
│   │   │   ├── schema.ts
│   │   │   ├── feature.ts
│   │   │   └── index.ts
│   │   ├── GetUser/
│   │   │   ├── GetUserUseCase.ts
│   │   │   ├── abstractions.ts
│   │   │   ├── feature.ts
│   │   │   └── index.ts
│   │   ├── ListUsers/
│   │   │   ├── ListUsersUseCase.ts
│   │   │   ├── abstractions.ts
│   │   │   ├── feature.ts
│   │   │   └── index.ts
│   │   ├── UpdateUser/
│   │   │   ├── UpdateUserUseCase.ts
│   │   │   ├── abstractions.ts
│   │   │   ├── events.ts
│   │   │   ├── schema.ts
│   │   │   ├── feature.ts
│   │   │   └── index.ts
│   │   ├── DeleteUser/
│   │   │   ├── DeleteUserUseCase.ts
│   │   │   ├── abstractions.ts
│   │   │   ├── events.ts
│   │   │   ├── feature.ts
│   │   │   └── index.ts
│   │   ├── shared/
│   │   │   ├── AdminUsersRepository.ts
│   │   │   ├── abstractions.ts
│   │   │   ├── errors.ts
│   │   │   └── types.ts
│   │   ├── feature.ts            # Main UsersFeature
│   │   └── index.ts              # Public API
│   └── legacy/                   # Backward compatibility adapters
│       ├── createAdminUsersAdapter.ts
│       └── graphql/              # GraphQL resolvers (optional)
├── types.ts                      # Re-export for backward compatibility
└── index.ts                      # Public API
```

---

## Migration Steps

### Phase 1: Shared Infrastructure

#### 1.1 Create Shared Types (`features/users/shared/types.ts`)
**Action:** Extract and refactor type definitions

```typescript
// Re-export domain entity
export type { AdminUser };

// Input types
export interface CreateUserInput {
    id?: string;
    displayName?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: Record<string, any>;
    groups?: string[];
    teams?: string[];
    password?: string;  // Only for Cognito
    external?: boolean;
}

export interface UpdateUserInput {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    avatar?: Record<string, any>;
    groups?: string[];
    teams?: string[];
}

export interface GetUserInput {
    id?: string;
    email?: string;
}

export interface ListUsersInput {
    where?: {
        id_in?: string[];
    };
    sort?: string[];
}

// Storage operation types (internal)
export interface StorageOperationsGetUserParams {
    where: {
        tenant: string;
        id?: string;
        email?: string;
    };
}

export interface StorageOperationsListUsersParams {
    where: {
        tenant: string;
        id_in?: string[];
    };
    sort?: string[];
}
```

**Files to create:**
- `features/users/shared/types.ts`

**Migration notes:**
- Keep `AdminUser` entity definition
- Simplify input types (remove optional tenant)
- Storage operation params remain internal

---

#### 1.2 Create Shared Errors (`features/users/shared/errors.ts`)
**Action:** Define domain-specific error classes

```typescript
import { BaseError } from "@webiny/feature/api";

// Storage/Infrastructure errors
export class UserStorageError extends BaseError {
    override readonly code = "USER_STORAGE_ERROR" as const;
    constructor(error: Error) {
        super({ message: error.message });
    }
}

// Domain errors
export class UserNotFoundError extends BaseError {
    override readonly code = "USER_NOT_FOUND" as const;
    constructor(id: string) {
        super({
            message: `User "${id}" was not found!`,
            data: { id }
        });
    }
}

export class UserExistsError extends BaseError<{ email: string }> {
    override readonly code = "USER_EXISTS" as const;
    constructor(email: string) {
        super({
            message: `User with email "${email}" already exists.`,
            data: { email }
        });
    }
}

export class UserValidationError extends BaseError<{ message: string }> {
    override readonly code = "USER_VALIDATION_ERROR" as const;
    constructor(message: string) {
        super({
            message,
            data: { message }
        });
    }
}

// Authorization error
export class NotAuthorizedError extends BaseError {
    override readonly code = "NOT_AUTHORIZED" as const;
    constructor(message?: string) {
        super({
            message: message || "Not authorized to perform this action"
        });
    }
}

// Business rule errors
export class CannotDeleteOwnAccountError extends BaseError {
    override readonly code = "CANNOT_DELETE_OWN_ACCOUNT" as const;
    constructor() {
        super({
            message: "You can't delete your own user account."
        });
    }
}
```

**Files to create:**
- `features/users/shared/errors.ts`

**Migration notes:**
- Replace `WebinyError` with `BaseError`
- Replace `NotFoundError` with `UserNotFoundError`
- Add typed data payloads where useful

---

#### 1.3 Create Repository Abstraction (`features/users/shared/abstractions.ts`)
**Action:** Define repository interface with Result pattern

```typescript
import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { AdminUser } from "~/types.js";
import type {
    CreateUserInput,
    UpdateUserInput,
    GetUserInput,
    ListUsersInput
} from "./types.js";
import {
    UserNotFoundError,
    UserStorageError
} from "./errors.js";

// Repository error interface
export interface IAdminUsersRepositoryErrors {
    base: UserNotFoundError | UserStorageError;
}

type RepositoryError = IAdminUsersRepositoryErrors[keyof IAdminUsersRepositoryErrors];

// Repository interface
export interface IAdminUsersRepository {
    get(params: GetUserInput): Promise<Result<AdminUser, RepositoryError>>;
    list(params: ListUsersInput): Promise<Result<AdminUser[], RepositoryError>>;
    create(user: AdminUser): Promise<Result<AdminUser, RepositoryError>>;
    update(user: AdminUser): Promise<Result<AdminUser, RepositoryError>>;
    delete(user: AdminUser): Promise<Result<void, RepositoryError>>;
    clearCache(keys: Array<{ tenant: string; id: string }>): void;
}

// Abstraction constant
export const AdminUsersRepository = createAbstraction<IAdminUsersRepository>(
    "AdminUsersRepository"
);

// Namespace exports
export namespace AdminUsersRepository {
    export type Interface = IAdminUsersRepository;
    export type Error = RepositoryError;
}
```

**Files to create:**
- `features/users/shared/abstractions.ts`

**Migration notes:**
- Repository methods return `Result<T, E>`
- No `checkEmailExists` - use `get({ email })` instead
- Add `clearCache` method for DataLoader management

---

#### 1.4 Create Repository Implementation (`features/users/shared/AdminUsersRepository.ts`)
**Action:** Implement repository using storage operations + DataLoader

```typescript
import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-tenancy";
import { AdminUsersRepository as RepositoryAbstraction } from "./abstractions.js";
import { AdminUsersStorageOperations } from "./storageAbstractions.js";
import { createUserLoaders } from "./loaders.js";
import {
    UserNotFoundError,
    UserStorageError
} from "./errors.js";
import type { AdminUser } from "~/types.js";
import type {
    GetUserInput,
    ListUsersInput
} from "./types.js";

class AdminUsersRepositoryImpl implements RepositoryAbstraction.Interface {
    private loaders: ReturnType<typeof createUserLoaders>;

    constructor(
        private tenantContext: TenantContext.Interface,
        private storageOperations: AdminUsersStorageOperations.Interface
    ) {
        // Initialize DataLoaders using existing implementation
        this.loaders = createUserLoaders({
            getTenant: () => this.tenantContext.getCurrentTenant().id,
            storageOperations: this.storageOperations
        });
    }

    async get(params: GetUserInput): Promise<Result<AdminUser, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getCurrentTenant().id;

            // Use DataLoader for ID-based queries (majority of queries)
            if (params.id) {
                const user = await this.loaders.getUser.load({
                    tenant,
                    id: params.id
                });

                if (!user) {
                    return Result.fail(new UserNotFoundError(params.id));
                }

                return Result.ok(user);
            }

            // Direct query for email-based lookups (rare)
            if (params.email) {
                const user = await this.storageOperations.getUser({
                    where: { tenant, email: params.email }
                });

                if (!user) {
                    return Result.fail(new UserNotFoundError(params.email));
                }

                return Result.ok(user);
            }

            return Result.fail(new UserNotFoundError("unknown"));
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }
    }

    async list(params: ListUsersInput): Promise<Result<AdminUser[], RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getCurrentTenant().id;
            const users = await this.storageOperations.listUsers({
                where: { tenant, ...params.where },
                sort: params.sort || ["createdOn_ASC"]
            });

            return Result.ok(users);
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }
    }

    async create(user: AdminUser): Promise<Result<AdminUser, RepositoryAbstraction.Error>> {
        try {
            const result = await this.storageOperations.createUser({ user });

            // Prime the cache with the new user
            this.loaders.getUser.clear(result.id).prime(result.id, result);

            return Result.ok(result);
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }
    }

    async update(user: AdminUser): Promise<Result<AdminUser, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.updateUser({ user });

            // Update the cache
            const tenant = this.tenantContext.getCurrentTenant().id;
            await this.loaders.updateDataLoaderUserCache({ tenant, id: user.id }, user);

            return Result.ok(user);
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }
    }

    async delete(user: AdminUser): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.deleteUser({ user });

            // Clear from cache
            const tenant = this.tenantContext.getCurrentTenant().id;
            this.clearCache([{ tenant, id: user.id }]);

            return Result.ok();
        } catch (error) {
            return Result.fail(new UserStorageError(error as Error));
        }
    }

    clearCache(keys: Array<{ tenant: string; id: string }>): void {
        this.loaders.clearLoadersCache(keys);
    }
}

export const AdminUsersRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: AdminUsersRepositoryImpl,
    dependencies: [TenantContext, AdminUsersStorageOperations]
});
```

**Files to create:**
- `features/users/shared/AdminUsersRepository.ts`
- `features/users/shared/loaders.ts` (move existing DataLoader code here)

**Migration notes:**
- Reuse existing DataLoader implementation from `createAdminUsers/users.loaders.ts`
- Move loaders to `shared/loaders.ts` with same logic
- DataLoader used for ID-based queries (fast path)
- Direct storage query for email lookups (rare)
- Cache management built into repository methods

---

### Phase 2: Use Cases

#### 2.1 CreateUser Use Case

**Files to create:**
- `features/users/CreateUser/abstractions.ts`
- `features/users/CreateUser/events.ts`
- `features/users/CreateUser/schema.ts`
- `features/users/CreateUser/CreateUserUseCase.ts`
- `features/users/CreateUser/feature.ts`
- `features/users/CreateUser/index.ts`

**Key implementation points:**
1. Check permission: `adminUsers.user`
2. Validate input with Zod schema
3. Check email uniqueness via `repository.get({ email })`
4. Generate ID if not provided
5. Generate display name from firstName/lastName/email
6. Publish `UserBeforeCreateEvent`
7. Call repository.create()
8. Increment WCP seats
9. Publish `UserAfterCreateEvent`
10. Return created user

**Error types:**
- `NotAuthorizedError`
- `UserValidationError`
- `UserExistsError` (when `repository.get({ email })` returns Ok)
- Repository errors (storage, etc.)

**Special handling:**
- Delete password field before storing
- Handle WCP integration (abstraction needed)
- Cache management handled by repository automatically

---

#### 2.2 GetUser Use Case

**Files to create:**
- `features/users/GetUser/abstractions.ts`
- `features/users/GetUser/GetUserUseCase.ts`
- `features/users/GetUser/feature.ts`
- `features/users/GetUser/index.ts`

**Key implementation points:**
1. Check permission
2. Call repository.get()
3. Return user

**Error types:**
- `NotAuthorizedError`
- Repository errors

**Special handling:**
- DataLoader integration handled by repository

---

#### 2.3 ListUsers Use Case

**Files to create:**
- `features/users/ListUsers/abstractions.ts`
- `features/users/ListUsers/ListUsersUseCase.ts`
- `features/users/ListUsers/feature.ts`
- `features/users/ListUsers/index.ts`

**Key implementation points:**
1. Check permission
2. Call repository.list()
3. Return users

**Error types:**
- `NotAuthorizedError`
- Repository errors

---

#### 2.4 UpdateUser Use Case

**Files to create:**
- `features/users/UpdateUser/abstractions.ts`
- `features/users/UpdateUser/events.ts`
- `features/users/UpdateUser/schema.ts`
- `features/users/UpdateUser/UpdateUserUseCase.ts`
- `features/users/UpdateUser/feature.ts`
- `features/users/UpdateUser/index.ts`

**Key implementation points:**
1. Check permission
2. Get existing user
3. Validate input with Zod schema
4. Publish `UserBeforeUpdateEvent`
5. Merge updates with existing user
6. Call repository.update()
7. Publish `UserAfterUpdateEvent`
8. Return updated user

**Error types:**
- `NotAuthorizedError`
- `UserNotFoundError`
- `UserValidationError`
- Repository errors

**Special handling:**
- Clone updateData for event modification
- Cache management handled by repository automatically

---

#### 2.5 DeleteUser Use Case

**Files to create:**
- `features/users/DeleteUser/abstractions.ts`
- `features/users/DeleteUser/events.ts`
- `features/users/DeleteUser/DeleteUserUseCase.ts`
- `features/users/DeleteUser/feature.ts`
- `features/users/DeleteUser/index.ts`

**Key implementation points:**
1. Check permission
2. Get existing user
3. Check if deleting own account
4. Publish `UserBeforeDeleteEvent`
5. Call repository.delete()
6. Decrement WCP seats
7. Publish `UserAfterDeleteEvent`

**Error types:**
- `NotAuthorizedError`
- `UserNotFoundError`
- `CannotDeleteOwnAccountError`
- Repository errors

**Special handling:**
- Check identity.id != user.id
- Handle WCP integration
- Cache management handled by repository automatically

---

### Phase 3: Dependencies & Abstractions

#### 3.1 Create Legacy Abstraction for Storage Operations

**File:** `features/users/shared/storageAbstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/api";
import type { AdminUsersStorageOperations } from "~/types.js";

export const AdminUsersStorageOperations = createAbstraction<AdminUsersStorageOperations>(
    "AdminUsersStorageOperations"
);

export namespace AdminUsersStorageOperations {
    export type Interface = AdminUsersStorageOperations;
}
```

**Migration notes:**
- Wraps legacy storage operations interface
- Allows DI container to inject storage implementation

---

#### 3.2 Create WCP Abstraction

**File:** `features/users/shared/wcpAbstractions.ts`

```typescript
import { createAbstraction } from "@webiny/feature/api";

export interface IWcpSeatsService {
    incrementSeats(): Promise<void>;
    decrementSeats(): Promise<void>;
}

export const WcpSeatsService = createAbstraction<IWcpSeatsService>("WcpSeatsService");

export namespace WcpSeatsService {
    export type Interface = IWcpSeatsService;
}
```

**Migration notes:**
- Abstracts WCP integration
- Implementation registered from context

---

### Phase 4: Event Migration

#### 4.1 Event Definitions

**Pattern for all CRUD events:**

```typescript
// events.ts
import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";

// Before Create
export class UserBeforeCreateEvent extends DomainEvent<UserBeforeCreatePayload> {
    eventType = "user.beforeCreate" as const;

    getHandlerAbstraction() {
        return UserBeforeCreateHandler;
    }
}

export const UserBeforeCreateHandler = createAbstraction<IEventHandler<UserBeforeCreateEvent>>(
    "UserBeforeCreateHandler"
);

export namespace UserBeforeCreateHandler {
    export type Interface = IEventHandler<UserBeforeCreateEvent>;
    export type Event = UserBeforeCreateEvent;
}

// After Create
export class UserAfterCreateEvent extends DomainEvent<UserAfterCreatePayload> {
    eventType = "user.afterCreate" as const;

    getHandlerAbstraction() {
        return UserAfterCreateHandler;
    }
}

export const UserAfterCreateHandler = createAbstraction<IEventHandler<UserAfterCreateEvent>>(
    "UserAfterCreateHandler"
);

export namespace UserAfterCreateHandler {
    export type Interface = IEventHandler<UserAfterCreateEvent>;
    export type Event = UserAfterCreateEvent;
}
```

**Events to create:**
- CreateUser: `UserBeforeCreateEvent`, `UserAfterCreateEvent`
- UpdateUser: `UserBeforeUpdateEvent`, `UserAfterUpdateEvent`
- DeleteUser: `UserBeforeDeleteEvent`, `UserAfterDeleteEvent`

**Note:** Error events can be handled via event handlers that catch errors, not separate events

---

### Phase 5: Feature Registration

#### 5.1 Main Feature (`features/users/feature.ts`)

```typescript
import { createFeature } from "@webiny/feature/api";
import { AdminUsersRepository } from "./shared/AdminUsersRepository.js";
import { GetUserFeature } from "./GetUser/feature.js";
import { ListUsersFeature } from "./ListUsers/feature.js";
import { CreateUserFeature } from "./CreateUser/feature.js";
import { UpdateUserFeature } from "./UpdateUser/feature.js";
import { DeleteUserFeature } from "./DeleteUser/feature.js";

export const UsersFeature = createFeature({
    name: "Users",
    register(container) {
        // Register repository in singleton scope
        container.register(AdminUsersRepository).inSingletonScope();

        // Register all use cases
        GetUserFeature.register(container);
        ListUsersFeature.register(container);
        CreateUserFeature.register(container);
        UpdateUserFeature.register(container);
        DeleteUserFeature.register(container);
    }
});
```

---

### Phase 6: Backward Compatibility

#### 6.1 Legacy Adapter (`features/legacy/createAdminUsersAdapter.ts`)

**Purpose:** Provide backward-compatible API while using new use cases under the hood

```typescript
import { createTopic } from "@webiny/pubsub";
import type { Container } from "@webiny/di-container";
import type { AdminUsers } from "~/types.js";
import { CreateUserUseCase } from "../users/CreateUser";
import { GetUserUseCase } from "../users/GetUser";
import { ListUsersUseCase } from "../users/ListUsers";
import { UpdateUserUseCase } from "../users/UpdateUser";
import { DeleteUserUseCase } from "../users/DeleteUser";
import { UserBeforeCreateHandler, UserAfterCreateHandler } from "../users/CreateUser/events.js";
// ... other handlers

/**
 * Adapter that wraps new use case architecture with legacy AdminUsers interface
 */
export const createAdminUsersAdapter = (container: Container): AdminUsers => {
    // Resolve use cases
    const createUserUseCase = container.resolve(CreateUserUseCase);
    const getUserUseCase = container.resolve(GetUserUseCase);
    const listUsersUseCase = container.resolve(ListUsersUseCase);
    const updateUserUseCase = container.resolve(UpdateUserUseCase);
    const deleteUserUseCase = container.resolve(DeleteUserUseCase);

    // Create PubSub topics for backward compatibility
    const onUserBeforeCreate = createTopic("adminUsers.onCreateBefore");
    const onUserAfterCreate = createTopic("adminUsers.onCreateAfter");
    // ... other topics

    // Register PubSub -> Domain Event adapters
    // These convert PubSub subscriptions to domain event handlers
    container.register(createPubSubEventAdapter({
        abstraction: UserBeforeCreateHandler,
        topic: onUserBeforeCreate,
        convertPayload: (event) => ({ user: event.payload.user, inputData: event.payload.input })
    }));

    return {
        onUserBeforeCreate,
        onUserAfterCreate,
        // ... other topics

        getStorageOperations() {
            return container.resolve(AdminUsersStorageOperations);
        },

        async isEmailTaken(email) {
            // Use repository.get to check existence
            const getUserResult = await repository.get({ email });
            if (getUserResult.isOk()) {
                // User exists
                throw new WebinyError({
                    message: "User with that email already exists.",
                    code: "USER_EXISTS",
                    data: { email }
                });
            }
            // User not found means email is available (expected)
            // Any other error should be thrown
            if (getUserResult.error.code !== "USER_NOT_FOUND") {
                throw convertErrorToWebinyError(getUserResult.error);
            }
        },

        async createUser(data) {
            const result = await createUserUseCase.execute(data);
            if (result.isFail()) {
                // Convert Result errors to thrown errors
                throw convertErrorToWebinyError(result.error);
            }
            return result.value;
        },

        async getUser({ where }) {
            const result = await getUserUseCase.execute(where);
            if (result.isFail()) {
                if (result.error.code === "USER_NOT_FOUND") {
                    return null; // Legacy behavior
                }
                throw convertErrorToWebinyError(result.error);
            }
            return result.value;
        },

        // ... other methods
    };
};
```

**Migration notes:**
- Keeps old PubSub API
- Converts Result to throwing errors
- Adapts new event system to old topics

---

### Phase 7: Public API

#### 7.1 Feature Index (`features/users/index.ts`)

```typescript
export * from "./shared/abstractions.js";
export * from "./shared/types.js";
export * from "./GetUser/index.js";
export * from "./ListUsers/index.js";
export * from "./CreateUser/index.js";
export * from "./UpdateUser/index.js";
export * from "./DeleteUser/index.js";
export * from "./feature.js";
```

#### 7.2 Package Index (`index.ts`)

```typescript
// New API
export * from "./features/users/index.js";

// Legacy API (for backward compatibility)
export { createAdminUsersAdapter } from "./features/legacy/createAdminUsersAdapter.js";
export type { AdminUsers, AdminUsersContext } from "./types.js";

// GraphQL (if keeping in package)
export { default as createAdminUsersGraphQL } from "./features/legacy/graphql/index.js";
```

---

## Implementation Order

### Step 1: Shared Infrastructure
1. Create `shared/types.ts` ✓
2. Create `shared/errors.ts` ✓
3. Create `shared/abstractions.ts` (repository) ✓
4. Create `shared/storageAbstractions.ts` (legacy) ✓
5. Create `shared/wcpAbstractions.ts` ✓
6. Move `createAdminUsers/users.loaders.ts` → `shared/loaders.ts` ✓
7. Create `shared/AdminUsersRepository.ts` (with DataLoader) ✓

### Step 2: Simple Use Cases (No Events)
1. GetUser use case ✓
2. ListUsers use case ✓

### Step 3: Complex Use Cases (With Events)
1. CreateUser use case ✓
2. UpdateUser use case ✓
3. DeleteUser use case ✓

### Step 4: Feature Composition
1. Individual feature files ✓
2. Main `UsersFeature` ✓
3. Public API exports ✓

### Step 5: Backward Compatibility
1. Legacy adapter ✓
2. PubSub event adapters ✓
3. GraphQL integration (optional) ✓

### Step 6: Testing
1. Unit tests for each use case
2. Integration tests
3. E2E tests with GraphQL

---

## Breaking Changes vs Backward Compatible

### Backward Compatible (Phase 1)
- Keep legacy `createAdminUsers` via adapter
- Keep PubSub topics
- Keep GraphQL resolvers
- Keep types exported from root

### Breaking Changes (Phase 2 - Future)
- Remove legacy adapter
- Remove PubSub topics (use domain events only)
- Consumers use Result pattern
- Consumers register features directly

---

## Additional Considerations

### 1. DataLoader Integration
**Current:** DataLoader in `createAdminUsers/users.loaders.ts`

**Decision:** Move to repository implementation

**Implementation:**
- Move existing DataLoader code to `shared/loaders.ts`
- Initialize DataLoaders in repository constructor
- Use DataLoader for ID-based queries (fast path)
- Direct storage queries for email lookups (rare)
- Cache management (prime/clear) built into repository methods

**Benefits:**
- Centralized caching logic
- Use cases don't need to know about caching
- Reuses existing battle-tested DataLoader implementation

### 2. Validation
**Current:** Validation via PubSub subscription

**New:** Zod schemas in each use case

**Files:**
- `CreateUser/schema.ts`
- `UpdateUser/schema.ts`

### 3. External IdP Hooks
**Current:** `createExternalIdpAdminUserHooks.ts`

**New:** Event handlers that subscribe to `UserBeforeCreateHandler`

### 4. WCP Integration
**Current:** Direct context access

**New:** Abstraction with implementation registered from context

### 5. GraphQL Layer
**Current:** In same package

**Options:**
- A) Keep in same package under `features/legacy/graphql/`
- B) Move to separate package `api-admin-users-graphql`

**Recommendation:** Keep in same package for now, move later

---

## Success Criteria

1. ✅ All use cases follow Clean Architecture pattern
2. ✅ All dependencies use DI container
3. ✅ All errors use Result monad pattern
4. ✅ All events use domain event system
5. ✅ Repository pattern abstracts storage
6. ✅ One class per file
7. ✅ Backward compatibility maintained via adapter
8. ✅ All existing tests pass
9. ✅ No breaking changes to consumers

---

## Timeline Estimate

- **Phase 1 (Shared):** 1-2 days
- **Phase 2 (Get/List):** 1 day
- **Phase 3 (Create/Update/Delete):** 2-3 days
- **Phase 4 (Events):** 1 day
- **Phase 5 (Features):** 1 day
- **Phase 6 (Legacy):** 2 days
- **Phase 7 (Testing):** 2-3 days

**Total:** ~10-13 days

---

## Next Steps

1. Review this plan with team
2. Confirm architectural decisions
3. Start with Phase 1 (Shared Infrastructure)
4. Implement one complete use case (GetUser) as proof of concept
5. Iterate and refine
6. Complete remaining use cases
7. Add backward compatibility layer
8. Test thoroughly
9. Document migration guide for consumers
