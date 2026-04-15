# Schema-Based Permissions — Backend Implementation Guide

## Overview

Webiny uses a **schema-based permission system** defined in `@webiny/api-core/features/security/permissions/createPermissions.ts`. Each package declares a permission schema and gets a typed `Permissions` abstraction that can be injected into use cases via the DI container.

## Permission Schema Definition

**Location:** `packages/<package>/src/domain/permissions.ts` (or `src/permissions/schema.ts` for FM)

```ts
import { createPermissions } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";

const schema = {
  prefix: "wb", // Permission prefix
  fullAccess: { name: "wb.*" }, // Wildcard = full access to all entities
  entities: [
    {
      id: "page", // Entity identifier (used in method calls)
      permission: "wb.page", // Permission name stored on the identity
      scopes: ["full", "own"], // Access scopes: "full" = all records, "own" = only own
      actions: [
        // Action groups
        { name: "rwd" }, // Read/Write/Delete (string chars: "r", "w", "d")
        { name: "pw" } // Publish/Unpublish (string chars: "p", "u")
      ]
    },
    {
      id: "settings",
      permission: "wb.settings",
      scopes: ["full"] // No "own" — no ownership concept for settings
    }
  ]
} as const; // MUST use `as const` for type narrowing

type MySchema = typeof schema;

export const MyPermissions = createPermissions(schema);

export namespace MyPermissions {
  export type Interface = Permissions<MySchema>;
}
```

### Schema Fields

| Field                   | Description                                                             |
| ----------------------- | ----------------------------------------------------------------------- |
| `prefix`                | Used to namespace the DI abstraction: `${prefix}:Permissions`           |
| `fullAccess.name`       | Wildcard permission (e.g. `"wb.*"`) — grants all entity access          |
| `entities[].id`         | Entity identifier used in method calls: `canRead("page")`               |
| `entities[].permission` | Permission name matched against identity permissions                    |
| `entities[].scopes`     | `["full"]` or `["full", "own"]` — determines if `own` flag is supported |
| `entities[].actions`    | Action definitions — built-in: `"rwd"`, `"pw"`; custom: boolean flags   |

### Scopes

- **`"full"`** — User can access all records (default when no `own` flag on permission object)
- **`"own"`** — User can only access records where `createdBy.id === identity.id`

When an entity supports `"own"`, the permission object stored on the identity may include `own: true`.

## Permission Methods

All methods follow a 3-tier bypass:

1. `identityContext.hasFullAccess()` → `name: "*"` permission (super admin)
2. `hasFullSchemaAccess()` → wildcard permission (e.g. `"wb.*"`)
3. Entity-level permission check

### Method Reference

| Method                      | Purpose                          | Item-aware | Notes                                                                                         |
| --------------------------- | -------------------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `canAccess(entity, item?)`  | General access check             | Yes        | Without item: checks entity permission exists. With item + `own: true`: checks `createdBy.id` |
| `onlyOwnRecords(entity)`    | Should list filter by createdBy? | No         | Returns `true` when ALL permissions have `own: true`                                          |
| `canRead(entity)`           | Read permission                  | No         | Checks `rwd` includes `"r"` (or no `rwd` = unrestricted)                                      |
| `canCreate(entity)`         | Create permission                | No         | Checks `rwd` includes `"w"`                                                                   |
| `canEdit(entity, item?)`    | Edit permission                  | Yes        | With `own: true` + no item → allows (new/unsaved). With item → checks ownership               |
| `canDelete(entity, item?)`  | Delete permission                | Yes        | With `own: true` + no item → **RETURNS FALSE**. Must pass item for own-scope delete           |
| `canPublish(entity)`        | Publish permission               | No         | Checks `pw` includes `"p"`                                                                    |
| `canUnpublish(entity)`      | Unpublish permission             | No         | Checks `pw` includes `"u"`                                                                    |
| `canAction(action, entity)` | Custom boolean action            | No         | Checks `permission[action] === true`                                                          |

### OwnableItem Interface

```ts
interface OwnableItem {
  createdBy?: { id: string } | null;
}
```

## Use Case Implementation Patterns

### Get Use Case (Read + Ownership Gate)

The Get use case is the **central ownership gate** — mutation use cases that delegate to GetById inherit ownership enforcement automatically.

```ts
import { Result } from "@webiny/feature/api";
import { GetByIdUseCase as UseCaseAbstraction, GetByIdRepository } from "./abstractions.js";
import { MyPermissions } from "~/domain/permissions.js";
import { NotAuthorizedError } from "~/domain/errors.js";

class GetByIdUseCaseImpl implements UseCaseAbstraction.Interface {
  constructor(
    private permissions: MyPermissions.Interface,
    private repository: GetByIdRepository.Interface
  ) {}

  async execute(id: string): UseCaseAbstraction.Return {
    // 1. Entity-level read check
    if (!(await this.permissions.canRead("entity"))) {
      return Result.fail(new NotAuthorizedError());
    }

    // 2. Fetch
    const result = await this.repository.execute(id);
    if (result.isFail()) {
      return result;
    }

    // 3. Item-level ownership check
    if (!(await this.permissions.canAccess("entity", result.value))) {
      return Result.fail(new NotAuthorizedError());
    }

    return result;
  }
}

export const GetByIdUseCase = UseCaseAbstraction.createImplementation({
  implementation: GetByIdUseCaseImpl,
  dependencies: [MyPermissions.Abstraction, GetByIdRepository]
});
```

### List Use Case (Read + Own Records Filter)

```ts
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

class ListUseCaseImpl implements UseCaseAbstraction.Interface {
  constructor(
    private permissions: MyPermissions.Interface,
    private identityContext: IdentityContext.Interface,
    private repository: ListRepository.Interface
  ) {}

  async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
    if (!(await this.permissions.canRead("entity"))) {
      return Result.fail(new NotAuthorizedError());
    }

    const where = { ...params.where };

    // Filter to own records if needed
    if (await this.permissions.onlyOwnRecords("entity")) {
      const identity = this.identityContext.getIdentity();
      where.createdBy = identity.id;
    }

    return this.repository.execute({ ...params, where });
  }
}

// Dependencies must include IdentityContext
dependencies: [MyPermissions.Abstraction, IdentityContext, ListRepository];
```

**Important:** The list `where` type must include `createdBy?: string`. For CMS-based entities, `CmsEntryListWhere` already has this. For custom where types, add it manually.

### Update/Move Use Case (Edit + Item-Level Check)

```ts
class UpdateUseCaseImpl implements UseCaseAbstraction.Interface {
  constructor(
    private permissions: MyPermissions.Interface,
    private eventPublisher: EventPublisherAbstraction.Interface,
    private getById: GetByIdUseCase.Interface, // Delegates ownership gate
    private repository: UpdateRepository.Interface
  ) {}

  async execute(id: string, data: UpdateData): UseCaseAbstraction.Return {
    // 1. Entity-level edit check (no item yet)
    if (!(await this.permissions.canEdit("entity"))) {
      return Result.fail(new NotAuthorizedError());
    }

    // 2. Fetch original (enforces canRead + canAccess via GetById)
    const getResult = await this.getById.execute(id);
    if (getResult.isFail()) {
      return getResult;
    }

    const original = getResult.value;

    // 3. Item-level edit check (defense in depth)
    if (!(await this.permissions.canEdit("entity", original))) {
      return Result.fail(new NotAuthorizedError());
    }

    // ... events + repository
  }
}
```

### Delete Use Case (CRITICAL: Item-Level Delete)

**`canDelete` with `own: true` and no item returns `false`.**

Unlike `canEdit` (which returns `true` for `own: true` + no item), `canDelete` requires the item to verify ownership. Therefore, the delete use case MUST fetch the item first, then call `canDelete` with the item.

```ts
class DeleteUseCaseImpl implements UseCaseAbstraction.Interface {
  async execute(params: Params): UseCaseAbstraction.Return {
    // Fetch first (enforces canRead + canAccess via GetById)
    const getResult = await this.getById.execute(params.id);
    if (getResult.isFail()) {
      return Result.fail(getResult.error);
    }

    const item = getResult.value;

    // Item-level delete check — MUST pass the item
    if (!(await this.permissions.canDelete("entity", item))) {
      return Result.fail(new NotAuthorizedError());
    }

    // ... events + repository
  }
}
```

### Publish/Unpublish Use Case (Publish + Ownership)

```ts
class PublishUseCaseImpl {
  async execute(params: Params): UseCaseAbstraction.Return {
    // 1. Entity-level publish check
    if (!(await this.permissions.canPublish("entity"))) {
      return Result.fail(new NotAuthorizedError());
    }

    // 2. Fetch (enforces ownership via GetById)
    const getResult = await this.getById.execute(params.id);
    if (getResult.isFail()) {
      return getResult;
    }

    const item = getResult.value;

    // 3. Item-level ownership check (defense in depth)
    if (!(await this.permissions.canAccess("entity", item))) {
      return Result.fail(new NotAuthorizedError());
    }

    // ... events + repository
  }
}
```

### CreateRevisionFrom Use Case (Cross-Entity Delegation)

When a use case creates a new record based on an existing one (e.g. creating a revision from another page), add `GetByIdUseCase` as a dependency to enforce ownership on the **source** entity.

```ts
class CreateRevisionFromUseCaseImpl {
  constructor(
    private permissions: MyPermissions.Interface,
    private eventPublisher: EventPublisherAbstraction.Interface,
    private getById: GetByIdUseCase.Interface, // Added for ownership
    private repository: CreateRevisionFromRepository.Interface
  ) {}

  async execute(params: Params): UseCaseAbstraction.Return {
    if (!(await this.permissions.canCreate("entity"))) {
      return Result.fail(new NotAuthorizedError());
    }

    // Verify ownership of the source record
    const getResult = await this.getById.execute(params.id);
    if (getResult.isFail()) {
      return getResult;
    }

    // ... events + repository
  }
}

dependencies: [
  MyPermissions.Abstraction,
  EventPublisher,
  GetByIdUseCase,
  CreateRevisionFromRepository
];
```

## Testing Patterns

### Test Setup

Use `useHandler` with `permissions` and `identity` params:

```ts
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

const identityA: IdentityData = { id: "identity-a", type: "admin", displayName: "User A" };
const identityB: IdentityData = { id: "identity-b", type: "admin", displayName: "User B" };

// Full access handler (for seeding data)
const handler = useHandler({ identity: identityA });

// Restricted handler (for testing permissions)
const handler = useHandler({
  permissions: [{ name: "wb.page", own: true, rwd: "rw" }],
  identity: identityB
});
```

### Permission Object Shape

```ts
// Full access to all WB entities
{ name: "wb.*" }

// Entity-level, unrestricted (no rwd = all actions)
{ name: "wb.page" }

// Fine-grained actions
{ name: "wb.page", rwd: "rw" }      // Read + Write (no Delete)
{ name: "wb.page", rwd: "rwd" }     // Read + Write + Delete
{ name: "wb.page", pw: "p" }        // Publish only
{ name: "wb.page", pw: "pu" }       // Publish + Unpublish

// Own scope
{ name: "wb.page", own: true }                // Own records only, all actions
{ name: "wb.page", own: true, rwd: "rw" }     // Own records, Read + Write
{ name: "wb.page", own: true, rwd: "rwd" }    // Own records, Read + Write + Delete
```

### Test Matrix for Own Scope

| Scenario                   | Setup                                                         | Expected                               |
| -------------------------- | ------------------------------------------------------------- | -------------------------------------- |
| Get — wrong identity       | `own: true`, identityB reads identityA's record               | FAIL (NotAuthorized)                   |
| Get — correct identity     | `own: true`, identityA reads own record                       | OK                                     |
| Get — full access          | No `own` flag, identityB reads identityA's record             | OK                                     |
| List — own scope           | `own: true`                                                   | Only returns records matching identity |
| Update — wrong identity    | `own: true, rwd: "rw"`, identityB updates identityA's record  | FAIL                                   |
| Update — correct identity  | `own: true, rwd: "rw"`, identityA updates own record          | OK                                     |
| Delete — wrong identity    | `own: true, rwd: "rwd"`, identityB deletes identityA's record | FAIL                                   |
| Delete — correct identity  | `own: true, rwd: "rwd"`, identityA deletes own record         | OK                                     |
| Publish — wrong identity   | `own: true, pw: "p"`, identityB publishes identityA's record  | FAIL                                   |
| Publish — correct identity | `own: true, pw: "p"`, identityA publishes own record          | OK                                     |

### Seed Data Pattern

Always create seed data with full permissions and a known identity:

```ts
const createSeed = async () => {
  const handler = useHandler({ identity: identityA }); // Full permissions (no `permissions` param)
  const ctx = await handler.handler();
  const useCase = ctx.container.resolve(CreateUseCase);
  const result = await useCase.execute(mockData);
  if (result.isFail()) throw result.error;
  return result.value;
};
```

## Key Imports

```ts
// Permission creation
import { createPermissions } from "@webiny/api-core/features/security/permissions/index.js";
import type { Permissions } from "@webiny/api-core/features/security/permissions/index.js";

// IdentityContext (for list filtering)
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

// Test types
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
```

## Reference Implementations

| Package               | Permission Schema                                        | Key Files                                |
| --------------------- | -------------------------------------------------------- | ---------------------------------------- |
| `api-file-manager`    | `packages/api-file-manager/src/permissions/schema.ts`    | GetFile, UpdateFile, ListFiles use cases |
| `api-website-builder` | `packages/api-website-builder/src/domain/permissions.ts` | All page + redirect use cases            |

## Gotchas

1. **`canDelete` without item + `own: true` = `false`** — Always pass the item to `canDelete`. Fetch first, then check.
2. **`canEdit` without item + `own: true` = `true`** — Intentional: allows editing new/unsaved records.
3. **`canAccess` without item = `true`** — Only checks entity-level access, not ownership.
4. **List where type** — Ensure the `where` interface includes `createdBy?: string` for own-scope filtering.
5. **`as const`** — The schema MUST use `as const` for TypeScript to narrow entity IDs in method signatures.
6. **Dependencies order** — DI constructor params must match the `dependencies` array order exactly.
