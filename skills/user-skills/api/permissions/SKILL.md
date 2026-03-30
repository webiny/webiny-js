---
name: webiny-api-permissions
context: webiny-api
description: >
  Schema-based permission system for API features. Use this skill when implementing
  authorization in use cases, defining permission schemas with createPermissions,
  checking read/write/delete/publish permissions, handling own-record scoping,
  or testing permission scenarios. Covers the full pattern from schema definition
  to use case integration to test matrices.
---

# Schema-Based Permissions

## Overview

Webiny uses a **schema-based permission system** defined via `createPermissions`. Each package declares a permission schema and gets a typed `Permissions` abstraction injectable into use cases via DI. This replaces manual `identityContext.getPermission()` calls with high-level methods like `canRead`, `canEdit`, `canDelete`, `canPublish`, `onlyOwnRecords`, etc.

## Permission Schema Definition

```ts
// domain/permissions.ts (or permissions/schema.ts)
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
        { name: "rwd" }, // Read/Write/Delete (chars: "r", "w", "d")
        { name: "pw" } // Publish/Unpublish (chars: "p", "u")
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

`createPermissions` returns `{ Abstraction, Implementation }`. Register the Implementation in your feature.

### Schema Fields

| Field                   | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `prefix`                | Namespaces the DI abstraction: `${prefix}:Permissions`                |
| `fullAccess.name`       | Wildcard permission (e.g. `"wb.*"`) — grants all entity access        |
| `entities[].id`         | Entity identifier used in method calls: `canRead("page")`             |
| `entities[].permission` | Permission name matched against identity permissions                  |
| `entities[].scopes`     | `["full"]` or `["full", "own"]` — determines if own-scope supported   |
| `entities[].actions`    | Action definitions — built-in: `"rwd"`, `"pw"`; custom: boolean flags |

### Scopes

- **`"full"`** — User can access all records (default when no `own` flag on permission object)
- **`"own"`** — User can only access records where `createdBy.id === identity.id`

---

## Permission Methods

All methods follow a 3-tier bypass:

1. `identityContext.hasFullAccess()` → `name: "*"` permission (super admin)
2. `hasFullSchemaAccess()` → wildcard permission (e.g. `"wb.*"`)
3. Entity-level permission check

### Method Reference

| Method                      | Purpose               | Item-aware | Notes                                                                                         |
| --------------------------- | --------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `canAccess(entity, item?)`  | General access check  | Yes        | Without item: checks entity permission exists. With item + `own: true`: checks `createdBy.id` |
| `onlyOwnRecords(entity)`    | List filter flag      | No         | Returns `true` when ALL permissions have `own: true`                                          |
| `canRead(entity)`           | Read permission       | No         | Checks `rwd` includes `"r"` (or no `rwd` = unrestricted)                                      |
| `canCreate(entity)`         | Create permission     | No         | Checks `rwd` includes `"w"`                                                                   |
| `canEdit(entity, item?)`    | Edit permission       | Yes        | With `own: true` + no item → allows (new/unsaved). With item → checks ownership               |
| `canDelete(entity, item?)`  | Delete permission     | Yes        | With `own: true` + no item → **RETURNS FALSE**. Must pass item                                |
| `canPublish(entity)`        | Publish permission    | No         | Checks `pw` includes `"p"`                                                                    |
| `canUnpublish(entity)`      | Unpublish permission  | No         | Checks `pw` includes `"u"`                                                                    |
| `canAction(action, entity)` | Custom boolean action | No         | Checks `permission[action] === true`                                                          |

All return `Promise<boolean>`.

### OwnableItem Interface

```ts
interface OwnableItem {
  createdBy?: { id: string } | null;
}
```

---

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

**Important:** The list `where` type must include `createdBy?: string`. For CMS-based entities, `CmsEntryListWhere` already has this.

### Update Use Case (Edit + Item-Level Check)

```ts
class UpdateUseCaseImpl implements UseCaseAbstraction.Interface {
  constructor(
    private permissions: MyPermissions.Interface,
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

Unlike `canEdit` (which returns `true` for `own: true` + no item), `canDelete` requires the item to verify ownership. The delete use case MUST fetch the item first.

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

### Publish Use Case (Publish + Ownership)

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

    // 3. Item-level ownership check (defense in depth)
    if (!(await this.permissions.canAccess("entity", getResult.value))) {
      return Result.fail(new NotAuthorizedError());
    }

    // ... events + repository
  }
}
```

---

## Gotchas

1. **`canDelete` without item + `own: true` = `false`** — Always pass the item to `canDelete`. Fetch first, then check.
2. **`canEdit` without item + `own: true` = `true`** — Intentional: allows editing new/unsaved records.
3. **`canAccess` without item = `true`** — Only checks entity-level access, not ownership.
4. **List where type** — Ensure the `where` interface includes `createdBy?: string` for own-scope filtering.
5. **`as const`** — The schema MUST use `as const` for TypeScript to narrow entity IDs in method signatures.
6. **Dependencies order** — DI constructor params must match the `dependencies` array order exactly.

## Related Skills

- **webiny-api-architect** — Architecture overview, Services vs UseCases, feature structure
- **webiny-use-case-pattern** — UseCase implementation, Result handling, decorators
- **webiny-dependency-injection** — Injectable services catalog
