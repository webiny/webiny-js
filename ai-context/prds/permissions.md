# Frontend Permissions: Injectable Dependency

## Context

The frontend permission system (`createUsePermissions`) is a hook factory that returns plain functions — it cannot be injected as a dependency. The backend uses `createPermissions(schema)` → `{ Abstraction, Implementation }` for DI. Align the frontend with this pattern across three clean layers.

## Layer Separation

### Domain: schema only

```ts
// packages/app-website-builder/src/constants.ts (already exists)
export const WB_PERMISSIONS_SCHEMA = { prefix: "wb", ... } as const;
```

### Application (features): DI artifacts + registration

```ts
// packages/app-website-builder/src/features/permissions.ts
export const WbPermissions = createPermissions(WB_PERMISSIONS_SCHEMA);

// packages/app-website-builder/src/Extension.tsx
<RegisterFeature feature={WbPermissions.Feature} />
```

### Presentation: React hooks, components, UI config

```tsx
// hooks/components (consume DI)
export const usePermissions = createUsePermissions(WbPermissions);
export const HasPermission = createHasPermission(WbPermissions);

// UI registration (unchanged pattern)
<Security.Permissions
  name="website-builder"
  title="Website Builder"
  icon={<PermissionsIcon />}
  schema={WbPermissions.schema}
/>;
```

## Detailed Changes

### 1. New: `packages/app-admin/src/permissions/createPermissions.ts`

Domain-pure factory. No React, no UI metadata.

```ts
export function createPermissions<const S extends PermissionSchemaConfig>(schema: S) {
    class SchemaPermissions {
        constructor(private identityContext: IIdentityContext) {}

        canAccess(entityId: string): boolean { ... }
        canRead(entityId: string): boolean { ... }
        canCreate(entityId: string): boolean { ... }
        canEdit(entityId: string, item?: OwnableItem): boolean { ... }
        canDelete(entityId: string, item?: OwnableItem): boolean { ... }
        canPublish(entityId: string): boolean { ... }
        canUnpublish(entityId: string): boolean { ... }
        canAction(action: string, entityId: string): boolean { ... }
    }

    const Abstraction = createAbstraction<Permissions<S>>(`${schema.prefix}:Permissions`);
    const Implementation = Abstraction.createImplementation({
        implementation: SchemaPermissions,
        dependencies: [IdentityContext]
    });

    const Feature = createFeature({
        name: `${schema.prefix}:Permissions`,
        register(container) {
            container.register(Implementation).inSingletonScope();
        }
    });

    return { Abstraction, Feature, schema };
}
```

`SchemaPermissions` methods are synchronous ports of `buildResult()` from `usePermissions.ts` lines 40-186:

- Uses `this.identityContext.getIdentity()` per call (not closed-over identity)
- Adopts backend's stricter `hasFullSchemaAccess` — `{ name: "wb.*", rwd: "r" }` is NOT full access

Reuses `buildEntityMap`, `getEntity` helpers from current file.

### 2. Modify: `packages/app-admin/src/permissions/types.ts`

Add canonical type for DI contexts:

```ts
export type Permissions<S extends PermissionSchemaConfig> =
  string extends AllEntityIds<S> ? UsePermissionsResultUntyped : UsePermissionsResultTyped<S>;
```

Same underlying type as `UsePermissionsResult<S>`.

### 3. Modify: `packages/app-admin/src/permissions/usePermissions.ts`

Add overload accepting `createPermissions` result:

```ts
// New: DI-backed
export function createUsePermissions<const S extends PermissionSchemaConfig>(permissions: {
  Abstraction: Abstraction<Permissions<S>>;
  schema: S;
}): () => Permissions<S>;

// Deprecated: inline build
export function createUsePermissions<const S extends PermissionSchemaConfig>(
  schema: S
): () => UsePermissionsResult<S>;

export function createUsePermissions(schemaOrResult: any) {
  if ("Abstraction" in schemaOrResult) {
    return function usePermissions() {
      useIdentity(); // MobX re-render subscription
      const container = useContainer();
      return container.resolve(schemaOrResult.Abstraction);
    };
  }
  // ... existing inline implementation (deprecated path) ...
}
```

### 4. Modify: `packages/app-admin/src/permissions/createHasPermission.tsx`

Same overload pattern:

```ts
export function createHasPermission<const S extends PermissionSchemaConfig>(permissions: {
  Abstraction: Abstraction<Permissions<S>>;
  schema: S;
}): React.FC<HasPermissionProps<S>>;

export function createHasPermission<const S extends PermissionSchemaConfig>(
  schema: S
): React.FC<HasPermissionProps<S>>;

export function createHasPermission(schemaOrResult: any) {
  const usePermissions = createUsePermissions(schemaOrResult);
  return function HasPermission({ children, ...props }) {
    const permissions = usePermissions();
    // ... existing check logic ...
  };
}
```

### 5. Exports

Add to `packages/app-admin/src/permissions/index.ts` and `packages/app-admin/src/exports/admin.ts`:

- `createPermissions`
- `Permissions` type

## Consumer Migration (Website Builder)

### Features (application layer)

**New: `packages/app-website-builder/src/features/permissions.ts`**

```ts
import { createPermissions } from "@webiny/app-admin/exports/admin.js";
import type { Permissions } from "@webiny/app-admin/exports/admin.js";
import { WB_PERMISSIONS_SCHEMA } from "~/constants.js";

export const WbPermissions = createPermissions(WB_PERMISSIONS_SCHEMA);

export namespace WbPermissions {
  export type Interface = Permissions<typeof WB_PERMISSIONS_SCHEMA>;
}
```

### Extension

**Modify: `packages/app-website-builder/src/Extension.tsx`**

```tsx
// Add:
<RegisterFeature feature={WbPermissions.Feature} />

// Keep (unchanged — Security.Permissions stays for UI):
<Security.Permissions
    name="website-builder"
    title="Website Builder"
    description="Manage Website Builder permissions."
    icon={<PermissionsIcon />}
    schema={WbPermissions.schema}
/>

// HasPermission stays as-is (just the import source changes)
```

### Presentation hooks

**Modify: `packages/app-website-builder/src/presentation/security/usePermissions.ts`**

```ts
import { createUsePermissions } from "@webiny/app-admin/exports/admin.js";
import { WbPermissions } from "~/features/permissions.js";
export const usePermissions = createUsePermissions(WbPermissions);
```

**Modify: `packages/app-website-builder/src/presentation/security/HasPermission.tsx`**

```ts
import { createHasPermission } from "@webiny/app-admin/exports/admin.js";
import { WbPermissions } from "~/features/permissions.js";
export const HasPermission = createHasPermission(WbPermissions);
```

### DI injection (in features)

```ts
class SomeFeatureImpl {
  constructor(private permissions: WbPermissions.Interface) {}
}

const SomeFeature = createImplementation({
  implementation: SomeFeatureImpl,
  dependencies: [WbPermissions.Abstraction]
});
```

## Files Summary

| File                                                                       | Action                                 |
| -------------------------------------------------------------------------- | -------------------------------------- |
| `packages/app-admin/src/permissions/createPermissions.ts`                  | **New** — application-layer factory    |
| `packages/app-admin/src/permissions/types.ts`                              | **Modify** — add `Permissions<S>` type |
| `packages/app-admin/src/permissions/usePermissions.ts`                     | **Modify** — add DI-backed overload    |
| `packages/app-admin/src/permissions/createHasPermission.tsx`               | **Modify** — add DI-backed overload    |
| `packages/app-admin/src/permissions/index.ts`                              | **Modify** — exports                   |
| `packages/app-admin/src/exports/admin.ts`                                  | **Modify** — exports                   |
| `packages/app-website-builder/src/features/permissions.ts`                 | **New** — WB permissions               |
| `packages/app-website-builder/src/presentation/security/usePermissions.ts` | **Modify** — DI-backed                 |
| `packages/app-website-builder/src/presentation/security/HasPermission.tsx` | **Modify** — DI-backed                 |
| `packages/app-website-builder/src/Extension.tsx`                           | **Modify** — add `RegisterFeature`     |

**Unchanged:**

- `Security.Permissions` JSX — stays for UI registration
- `PermissionRenderer.tsx` — auto-generates UI from schema
- `usePermissionForm.ts` — form serialization
- `Permissions.tsx` component — accordion rendering

## Behavioral Changes

- **Stricter `hasFullSchemaAccess`**: `{ name: "wb.*", rwd: "r" }` ≠ full access (backend alignment)
- **Per-call identity read**: singleton reads fresh identity each call

## Verification

1. Build: `yarn build -p @webiny/app-admin && yarn build -p @webiny/app-website-builder`
2. Tests: `yarn test packages/app-admin 2>&1 | tail -50`
3. TypeScript: `canRead("page")` compiles, `canRead("bogus")` errors
4. Manual: permission UI accordion + gated menus work for non-admin user
