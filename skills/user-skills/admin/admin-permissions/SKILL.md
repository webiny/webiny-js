---
name: webiny-admin-permissions
context: webiny-extensions
description: >
  Admin-side permission UI registration using Security.Permissions. Use this skill when
  adding permission controls to the admin UI — schema-based auto-generated forms, custom
  permission UIs with usePermissionValue/usePermissionForm, entity dependencies, and
  the Security.Permissions component props. Covers both simple apps and complex
  multi-entity permission schemas.
---

# Admin Permissions UI

## Overview

Register permissions via `AdminConfig` + `Security.Permissions`. The framework auto-generates the UI from a schema and handles serialization. No form code needed for most apps.

## Schema-Based (Auto-Generated UI)

```tsx
import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as Icon } from "@webiny/icons/shield.svg";

const { Security } = AdminConfig;

export const MyPermission = () => {
  return (
    <AdminConfig>
      <Security.Permissions
        name="store-manager"
        title="Store Manager"
        description="Manage Store Manager permissions."
        icon={<Icon />}
        schema={{
          prefix: "sm",
          fullAccess: { name: "sm.*" },
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
        }}
      />
    </AdminConfig>
  );
};
```

Render `<MyPermission />` anywhere in your app's extension component.

## Schema Reference

| Field        | Type                 | Required | Description                                                    |
| ------------ | -------------------- | -------- | -------------------------------------------------------------- |
| `prefix`     | `string`             | Yes      | Permission prefix (e.g., `"sm"`)                               |
| `fullAccess` | `{ name: string }`   | Yes      | Permission emitted on "Full access" (e.g., `{ name: "sm.*" }`) |
| `entities`   | `EntityDefinition[]` | No       | Entity definitions. Omit for binary full/no access.            |

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

---

## Simple Apps (No Entities)

Omit `entities` for binary full/no access:

```tsx
<Security.Permissions
  name="my-app"
  title="My App"
  description="Manage My App access permissions."
  schema={{ prefix: "ma", fullAccess: { name: "ma.*" } }}
/>
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

## Matching API-Side Permissions

The admin schema and the API-side `createPermissions` schema should use the **same prefix, entity IDs, and action names**. This ensures the permissions emitted by the admin UI are correctly evaluated by the API.

```
Admin:  schema={{ prefix: "sm", entities: [{ id: "product", permission: "sm.product", ... }] }}
API:    createPermissions({ prefix: "sm", entities: [{ id: "product", permission: "sm.product", ... }] })
```

See **webiny-api-permissions** for the API-side implementation.

## Related Skills

- **webiny-api-permissions** — API-side permission checking (canRead, canEdit, etc.)
- **webiny-admin-architect** — Admin architecture, headless and presentation features
- **webiny-admin-ui-extensions** — Admin UI customization, decorators, config
