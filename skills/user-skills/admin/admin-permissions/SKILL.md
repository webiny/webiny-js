---
name: webiny-admin-permissions
context: webiny-extensions
description: >
  Admin-side permission UI registration and DI-backed permission checking.
  Use this skill when adding permission controls to the admin UI — schema-based
  auto-generated forms, injectable permissions via createPermissionsAbstraction/
  createPermissionsFeature, typed hooks (createUsePermissions), the HasPermission
  component (createHasPermission), and the Security.Permissions component props.
  Covers both simple apps and complex multi-entity permission schemas.
---

# Admin Permissions

## Overview

Permissions follow three layers: **domain** (schema), **features** (DI artifacts + registration), and **presentation** (hooks, components, UI config). The framework auto-generates the permission UI from a schema and provides injectable permission checking via the DI container.

## Layer 1: Domain — Permission Schema

Define the schema in `src/domain/permissionsSchema.ts`:

```ts
import { createPermissionSchema } from "webiny/admin/security";

export const SM_PERMISSIONS_SCHEMA = createPermissionSchema({
  prefix: "sm",
  fullAccess: true,
  entities: [
    {
      id: "product",
      title: "Products",
      permission: "sm.product",
      scopes: ["full", "own"],
      actions: [
        { name: "rwd" },
        { name: "pw" },
        { name: "import", label: "Import products" },
        { name: "export", label: "Export products" }
      ]
    },
    {
      id: "category",
      title: "Categories",
      permission: "sm.category",
      scopes: ["full"],
      actions: [{ name: "rwd" }]
    },
    {
      id: "settings",
      title: "Settings",
      permission: "sm.settings",
      scopes: ["full"]
    }
  ]
});
```

### Schema Reference

| Field            | Type                 | Required | Description                                                                                                                          |
| ---------------- | -------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `prefix`         | `string`             | Yes      | Permission prefix (e.g., `"sm"`)                                                                                                     |
| `fullAccess`     | `true \| object`     | Yes      | `true` for standard full access. Pass an object with custom boolean flags for full-access extras (e.g., `{ canForceUnlock: true }`). |
| `readOnlyAccess` | `boolean`            | No       | Whether to show a "Read-only access" option                                                                                          |
| `entities`       | `EntityDefinition[]` | No       | Entity definitions. Omit for binary full/no access.                                                                                  |

### Entity Definition

| Field        | Type                                   | Required | Description                                    |
| ------------ | -------------------------------------- | -------- | ---------------------------------------------- |
| `id`         | `string`                               | Yes      | Unique identifier for form field naming        |
| `title`      | `string`                               | No       | Display title. Falls back to `id`.             |
| `permission` | `string`                               | Yes      | Permission name emitted (e.g., `"sm.product"`) |
| `scopes`     | `("full" \| "own")[]`                  | Yes      | Available access scopes                        |
| `actions`    | `ActionDefinition[]`                   | No       | Actions on this entity                         |
| `dependsOn`  | `{ entity: string; requires: string }` | No       | Dependency on another entity                   |

### Actions

- `{ name: "rwd" }` — Read/Write/Delete select dropdown. Auto-set to `"rwd"` when scope is `"own"`.
- `{ name: "pw" }` — Publish/Unpublish checkbox group.
- `{ name: "custom", label: "Label" }` — Custom boolean flag.

### Entity Dependencies

Child entities can depend on a parent. If the parent lacks the required action, the child is pruned from output. `"own"` scope cascades to dependents.

```ts
{
    id: "review",
    permission: "sm.review",
    scopes: ["full", "own"],
    actions: [{ name: "rwd" }],
    dependsOn: { entity: "product", requires: "r" }
}
```

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
import { createPermissionsAbstraction } from "webiny/admin/security";
import type { Permissions } from "webiny/admin/security";
import { SM_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const SmPermissions = createPermissionsAbstraction(SM_PERMISSIONS_SCHEMA);

export namespace SmPermissions {
  export type Interface = Permissions<typeof SM_PERMISSIONS_SCHEMA>;
}
```

### Feature (`src/features/permissions/feature.ts`)

```ts
import { createPermissionsFeature } from "webiny/admin/security";
import { SM_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { SmPermissions } from "./abstractions.js";

export const SmPermissionsFeature = createPermissionsFeature(SM_PERMISSIONS_SCHEMA, SmPermissions);
```

### Extension Registration

Register the feature and the permission UI in your extension component:

```tsx
import { AdminConfig, RegisterFeature } from "webiny/admin/security";
import { ReactComponent as Icon } from "@webiny/icons/shield.svg";
import { SM_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";
import { SmPermissionsFeature } from "~/features/permissions/feature.js";

const { Security } = AdminConfig;

export const Extension = () => {
  return (
    <>
      <RegisterFeature feature={SmPermissionsFeature} />
      <AdminConfig>
        <Security.Permissions
          name="store-manager"
          title="Store Manager"
          description="Manage Store Manager permissions."
          icon={<Icon />}
          schema={SM_PERMISSIONS_SCHEMA}
        />
        {/* Routes, menus, etc. */}
      </AdminConfig>
    </>
  );
};
```

---

## Layer 3: Presentation — Hooks & Components

### `usePermissions` Hook

```ts
// src/presentation/security/usePermissions.ts
import { createUsePermissions } from "webiny/admin/security";
import { SmPermissions } from "~/features/permissions/abstractions.js";

export const usePermissions = createUsePermissions(SmPermissions);
```

Usage:

```ts
const permissions = usePermissions();

permissions.canAccess("product"); // has any access
permissions.canRead("product"); // rwd includes "r"
permissions.canCreate("product"); // rwd includes "w"
permissions.canEdit("product", item); // rwd includes "w", respects own scope
permissions.canDelete("product"); // rwd includes "d"
permissions.canPublish("product"); // pw includes "p"
permissions.canUnpublish("product"); // pw includes "u"
permissions.canAction("import", "product"); // custom boolean flag
```

Entity IDs are fully typed — `canRead("bogus")` produces a type error.

### `HasPermission` Component

```tsx
// src/presentation/security/HasPermission.tsx
import { createHasPermission } from "webiny/admin/security";
import { SmPermissions } from "~/features/permissions/abstractions.js";
import { SM_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

export const HasPermission = createHasPermission(SmPermissions, SM_PERMISSIONS_SCHEMA);
```

Usage in JSX:

```tsx
<HasPermission entity="product">
    {/* Rendered if user can access "product" */}
</HasPermission>

<HasPermission any={["product", "category"]}>
    {/* Rendered if user can access ANY of these entities */}
</HasPermission>

<HasPermission all={["product", "category"]}>
    {/* Rendered if user can access ALL of these entities */}
</HasPermission>

<HasPermission entity="product" action="read">
    {/* Rendered if user canRead("product") */}
</HasPermission>

<HasPermission entity="product" allActions={["read", "publish"]}>
    {/* Rendered if user canRead AND canPublish "product" */}
</HasPermission>

<HasPermission entity="product" someActions={["import", "export"]}>
    {/* Rendered if user can do ANY of these custom actions */}
</HasPermission>
```

---

## DI Injection in Features

Inject permissions into feature implementations:

```ts
import type { SmPermissions } from "~/features/permissions/abstractions.js";
import { SmPermissions as SmPermissionsAbstraction } from "~/features/permissions/abstractions.js";

class SomeFeatureImpl {
  constructor(private permissions: SmPermissions.Interface) {}

  doSomething() {
    if (this.permissions.canEdit("product")) {
      // ...
    }
  }
}

const SomeFeature = SomeAbstraction.createImplementation({
  implementation: SomeFeatureImpl,
  dependencies: [SmPermissionsAbstraction]
});
```

---

## `Security.Permissions` Props

| Prop          | Type               | Required                  | Description                                     |
| ------------- | ------------------ | ------------------------- | ----------------------------------------------- |
| `name`        | `string`           | Yes                       | Unique identifier for this permission renderer  |
| `title`       | `string`           | Yes                       | Display title in the accordion header           |
| `description` | `string`           | No                        | Description shown below the title               |
| `icon`        | `ReactElement`     | No                        | Icon in the accordion header                    |
| `schema`      | `PermissionSchema` | One of `schema`/`element` | Auto-generate UI from schema                    |
| `element`     | `ReactElement`     | One of `schema`/`element` | Fully custom permission UI                      |
| `system`      | `boolean`          | No                        | If `true`, renders before app-level permissions |

---

## File Structure

```
src/
├── domain/
│   └── permissionsSchema.ts          # createPermissionSchema()
├── features/
│   └── permissions/
│       ├── abstractions.ts           # createPermissionsAbstraction() + namespace type
│       └── feature.ts                # createPermissionsFeature()
├── presentation/
│   └── security/
│       ├── usePermissions.ts         # createUsePermissions()
│       └── HasPermission.tsx         # createHasPermission()
└── Extension.tsx                     # RegisterFeature + Security.Permissions
```

## Matching API-Side Permissions

The admin schema and the API-side `createPermissions` schema should use the **same prefix, entity IDs, and action names**. This ensures the permissions emitted by the admin UI are correctly evaluated by the API.

```
Admin:  createPermissionSchema({ prefix: "sm", entities: [{ id: "product", permission: "sm.product", ... }] })
API:    createPermissions({ prefix: "sm", entities: [{ id: "product", permission: "sm.product", ... }] })
```

See **webiny-api-permissions** for the API-side implementation.

## Related Skills

- **webiny-api-permissions** — API-side permission checking (canRead, canEdit, etc.)
- **webiny-admin-architect** — Admin architecture, headless and presentation features
- **webiny-admin-ui-extensions** — Admin UI customization, decorators, config
