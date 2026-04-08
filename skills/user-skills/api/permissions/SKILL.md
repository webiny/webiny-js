---
name: webiny-api-permissions
context: webiny-api
description: >
  Schema-based permission system for API features. Use this skill when implementing
  authorization in use cases, defining permission schemas with createPermissionSchema,
  creating injectable permissions via createPermissionsAbstraction/createPermissionsFeature,
  checking read/write/delete/publish permissions, handling own-record scoping,
  or testing permission scenarios. Covers the full pattern from schema definition
  to use case integration to test matrices.
---

# API Permissions

## Overview

Permissions follow two layers: **domain** (schema) and **features** (DI abstractions + feature registration). Each package declares a permission schema and gets a typed `Permissions` abstraction injectable into use cases via DI. Methods like `canRead`, `canEdit`, `canDelete`, `canPublish`, `onlyOwnRecords` replace manual `identityContext.getPermission()` calls.

## Layer 1: Domain — Permission Schema

Define the schema in `src/domain/permissionsSchema.ts`:

```ts
import { createPermissionSchema } from "webiny/api/security";

export const SM_PERMISSIONS_SCHEMA = createPermissionSchema({
  prefix: "sm",
  fullAccess: true,
  entities: [
    {
      id: "product",
      permission: "sm.product",
      scopes: ["full", "own"],
      actions: [{ name: "rwd" }, { name: "pw" }]
    },
    {
      id: "settings",
      permission: "sm.settings",
      scopes: ["full"]
    }
  ]
});
```

The schema MUST use `as const` inference (handled by `createPermissionSchema`) for TypeScript to narrow entity IDs in method signatures.

### Schema Fields

| Field                   | Description                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `prefix`                | Namespaces the DI abstraction: `${prefix}:Permissions`                                                                               |
| `fullAccess`            | `true` for standard full access. Pass an object with custom boolean flags for full-access extras (e.g., `{ canForceUnlock: true }`). |
| `entities[].id`         | Entity identifier used in method calls: `canRead("product")`                                                                         |
| `entities[].permission` | Permission name matched against identity permissions                                                                                 |
| `entities[].scopes`     | `["full"]` or `["full", "own"]` — determines if own-scope supported                                                                  |
| `entities[].actions`    | Action definitions — built-in: `"rwd"`, `"pw"`; custom: boolean flags                                                                |

### Scopes

- **`"full"`** — User can access all records (default when no `own` flag on permission object)
- **`"own"`** — User can only access records where `createdBy.id === identity.id`

### Simple Apps (No Entities)

Omit `entities` for binary full/no access:

```ts
export const MA_PERMISSIONS_SCHEMA = createPermissionSchema({
  prefix: "ma",
  fullAccess: true
});
```

---

## Layer 2: Features — DI Artifacts + Registration

### Abstraction (`src/features/permissions/abstractions.ts`)

```ts
import { createPermissionsAbstraction } from "webiny/api/security";
import type { Permissions } from "webiny/api/security";
import { SM_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const SmPermissions = createPermissionsAbstraction(SM_PERMISSIONS_SCHEMA);

export namespace SmPermissions {
  export type Interface = Permissions<typeof SM_PERMISSIONS_SCHEMA>;
}
```

### Feature (`src/features/permissions/feature.ts`)

```ts
import { createPermissionsFeature } from "webiny/api/security";
import { SM_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { SmPermissions } from "./abstractions.js";

export const SmPermissionsFeature = createPermissionsFeature(SM_PERMISSIONS_SCHEMA, SmPermissions);
```

### Registration

Register the feature in your context plugin:

```ts
import { SmPermissionsFeature } from "~/features/permissions/feature.js";

// In createContext:
SmPermissionsFeature.register(container);
```

---

## File Structure

```
src/
├── domain/
│   └── permissionsSchema.ts              # createPermissionSchema()
├── features/
│   └── permissions/
│       ├── abstractions.ts               # createPermissionsAbstraction() + namespace type
│       └── feature.ts                    # createPermissionsFeature()
└── index.ts                              # SmPermissionsFeature.register(container)
```

---

## Permission Methods

All methods follow a 3-tier bypass:

1. `identityContext.hasFullAccess()` → `name: "*"` permission (super admin)
2. `hasFullSchemaAccess()` → wildcard permission (e.g. `"sm.*"`)
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

All return `Promise<boolean>`. Entity IDs are fully typed — `canRead("bogus")` produces a type error.

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
import { Result } from "webiny/api";
import { GetByIdUseCase as UseCaseAbstraction, GetByIdRepository } from "./abstractions.js";
import { SmPermissions } from "~/features/permissions/abstractions.js";
import { NotAuthorizedError } from "~/domain/errors.js";

class GetByIdUseCaseImpl implements UseCaseAbstraction.Interface {
  constructor(
    private permissions: SmPermissions.Interface,
    private repository: GetByIdRepository.Interface
  ) {}

  async execute(id: string): UseCaseAbstraction.Return {
    // 1. Entity-level read check
    if (!(await this.permissions.canRead("product"))) {
      return Result.fail(new NotAuthorizedError());
    }

    // 2. Fetch
    const result = await this.repository.execute(id);
    if (result.isFail()) {
      return result;
    }

    // 3. Item-level ownership check
    if (!(await this.permissions.canAccess("product", result.value))) {
      return Result.fail(new NotAuthorizedError());
    }

    return result;
  }
}

export const GetByIdUseCase = UseCaseAbstraction.createImplementation({
  implementation: GetByIdUseCaseImpl,
  dependencies: [SmPermissions, GetByIdRepository]
});
```

### List Use Case (Read + Own Records Filter)

```ts
import { IdentityContext } from "webiny/api/security";

class ListUseCaseImpl implements UseCaseAbstraction.Interface {
  constructor(
    private permissions: SmPermissions.Interface,
    private identityContext: IdentityContext.Interface,
    private repository: ListRepository.Interface
  ) {}

  async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
    if (!(await this.permissions.canRead("product"))) {
      return Result.fail(new NotAuthorizedError());
    }

    const where = { ...params.where };

    // Filter to own records if needed
    if (await this.permissions.onlyOwnRecords("product")) {
      const identity = this.identityContext.getIdentity();
      where.createdBy = identity.id;
    }

    return this.repository.execute({ ...params, where });
  }
}

// Dependencies must include IdentityContext
dependencies: [SmPermissions, IdentityContext, ListRepository];
```

**Important:** The list `where` type must include `createdBy?: string`. For CMS-based entities, `CmsEntryListWhere` already has this.

### Update Use Case (Edit + Item-Level Check)

```ts
class UpdateUseCaseImpl implements UseCaseAbstraction.Interface {
  constructor(
    private permissions: SmPermissions.Interface,
    private getById: GetByIdUseCase.Interface,
    private repository: UpdateRepository.Interface
  ) {}

  async execute(id: string, data: UpdateData): UseCaseAbstraction.Return {
    // 1. Entity-level edit check (no item yet)
    if (!(await this.permissions.canEdit("product"))) {
      return Result.fail(new NotAuthorizedError());
    }

    // 2. Fetch original (enforces canRead + canAccess via GetById)
    const getResult = await this.getById.execute(id);
    if (getResult.isFail()) {
      return getResult;
    }

    const original = getResult.value;

    // 3. Item-level edit check (defense in depth)
    if (!(await this.permissions.canEdit("product", original))) {
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
    if (!(await this.permissions.canDelete("product", item))) {
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
    if (!(await this.permissions.canPublish("product"))) {
      return Result.fail(new NotAuthorizedError());
    }

    // 2. Fetch (enforces ownership via GetById)
    const getResult = await this.getById.execute(params.id);
    if (getResult.isFail()) {
      return getResult;
    }

    // 3. Item-level ownership check (defense in depth)
    if (!(await this.permissions.canAccess("product", getResult.value))) {
      return Result.fail(new NotAuthorizedError());
    }

    // ... events + repository
  }
}
```

---

## DI Injection

The permissions abstraction is passed directly as a dependency — it IS the DI key:

```ts
export const MyUseCase = UseCaseAbstraction.createImplementation({
  implementation: MyUseCaseImpl,
  dependencies: [SmPermissions, OtherDep]
});
```

**Note:** Use `SmPermissions` directly (not `SmPermissions.Abstraction`). The abstraction returned by `createPermissionsAbstraction` is the DI key itself.

---

## Gotchas

1. **`canDelete` without item + `own: true` = `false`** — Always pass the item to `canDelete`. Fetch first, then check.
2. **`canEdit` without item + `own: true` = `true`** — Intentional: allows editing new/unsaved records.
3. **`canAccess` without item = `true`** — Only checks entity-level access, not ownership.
4. **List where type** — Ensure the `where` interface includes `createdBy?: string` for own-scope filtering.
5. **Dependencies order** — DI constructor params must match the `dependencies` array order exactly.
6. **Abstraction is the DI key** — Use `SmPermissions` directly in dependencies, not `SmPermissions.Abstraction`.

## Matching Admin-Side Permissions

The API schema and the admin-side `createPermissionSchema` should use the **same prefix, entity IDs, and action names**. This ensures the permissions emitted by the admin UI are correctly evaluated by the API.

```
API:    createPermissionSchema({ prefix: "sm", entities: [{ id: "product", permission: "sm.product", ... }] })
Admin:  createPermissionSchema({ prefix: "sm", entities: [{ id: "product", permission: "sm.product", ... }] })
```

See **webiny-admin-permissions** for the admin-side implementation.

## Related Skills

- **webiny-admin-permissions** — Admin-side permission UI and DI-backed permission checking
- **webiny-api-architect** — Architecture overview, Services vs UseCases, feature structure
- **webiny-use-case-pattern** — UseCase implementation, Result handling, decorators
- **webiny-dependency-injection** — Injectable services catalog
