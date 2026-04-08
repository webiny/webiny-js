# Plan: Frontend Permissions as Injectable Dependency

> Source PRD: `ai-context/prds/permissions.md`

## Architectural decisions

Durable decisions that apply across all phases:

- **Package home**: `createPermissions` factory lives in `packages/app-admin/src/permissions/`
- **DI pattern**: Uses existing `createAbstraction` / `createFeature` / `RegisterFeature` infrastructure
- **Identity access**: Singleton reads `IdentityContext.getIdentity()` per method call. No MobX subscription needed in the hook — identity only changes on full app remount.
- **No caching**: Singleton recomputes on every call. Optimize later if needed.
- **Stricter `hasFullSchemaAccess`**: `{ name: "wb.*", rwd: "r" }` is NOT full access (backend alignment). No backwards compatibility shim.
- **Namespace merging**: Consumer packages use `const + namespace` pattern for co-locating value and type exports.
- **Deprecation strategy**: Old `createUsePermissions(schema)` overload stays until all consumers are migrated, then gets removed.

---

## Phase 1: Core factory + DI plumbing in `app-admin`

**Goal**: Ship the `createPermissions` factory and updated overloads so any consumer _can_ adopt the DI path.

### What to build

Create `createPermissions(schema)` that returns `{ Abstraction, Feature, schema }`. The inner `SchemaPermissions` class takes `IIdentityContext` as a DI dependency and implements the same permission methods (`canAccess`, `canRead`, `canCreate`, `canEdit`, `canDelete`, `canPublish`, `canUnpublish`, `canAction`) ported from the existing `buildResult()` logic — with the stricter `hasFullSchemaAccess` check.

Add DI-backed overloads to `createUsePermissions` and `createHasPermission` that detect `{ Abstraction }` in the argument and resolve from the container instead of building inline. The simplified hook just resolves from the container — no `useIdentity()` subscription.

Export `createPermissions` and the `Permissions<S>` type from `permissions/index.ts` and `exports/admin.ts`.

### Acceptance criteria

- [ ] `createPermissions(schema)` returns `{ Abstraction, Feature, schema }` with correct types
- [ ] `SchemaPermissions` reads identity via `IdentityContext` DI dependency (not hooks)
- [ ] `hasFullSchemaAccess` rejects `{ name: "prefix.*", rwd: "r" }` as partial access
- [ ] `createUsePermissions({ Abstraction, schema })` resolves from DI container
- [ ] `createHasPermission({ Abstraction, schema })` delegates to DI-backed hook
- [ ] Old `createUsePermissions(schema)` overload still works (deprecated path)
- [ ] Existing `createHasPermission` tests pass
- [ ] `createPermissions` and `Permissions` type exported from `@webiny/app-admin/exports/admin.js`
- [ ] Build succeeds: `yarn build -p @webiny/app-admin`

---

## Phase 2: Website Builder pilot migration

**Goal**: Migrate WB to the DI-backed path end-to-end. Validate the pattern in a real consumer.

### What to build

Create `packages/app-website-builder/src/features/permissions.ts` with `WbPermissions = createPermissions(WB_PERMISSIONS_SCHEMA)` and the namespace-merged `WbPermissions.Interface` type.

Register `WbPermissions.Feature` via `<RegisterFeature>` in `Extension.tsx`. Update the `<Security.Permissions>` JSX to use `WbPermissions.schema`.

Rewrite `presentation/security/usePermissions.ts` and `HasPermission.tsx` to pass `WbPermissions` (the DI result) to `createUsePermissions` / `createHasPermission` instead of the raw schema.

### Acceptance criteria

- [ ] `WbPermissions` feature registered in `Extension.tsx`
- [ ] `usePermissions` and `HasPermission` use DI-backed overloads
- [ ] `WbPermissions.Interface` type available for DI injection in features
- [ ] Permission-gated menus, routes, and dashboard widgets render correctly for non-admin users
- [ ] `canRead("page")` compiles; `canRead("bogus")` produces a type error
- [ ] Build succeeds: `yarn build -p @webiny/app-website-builder`

---

## Phase 3: Migrate remaining consumers

**Goal**: Move all other permission consumers to the DI-backed pattern, then remove the deprecated overload.

### Consumers to migrate

Each package below registers `<Security.Permissions>` and may add programmatic permission checks as the codebase evolves. Migrating them now means future feature work gets DI injection for free.

| Package                          | Permission name |
| -------------------------------- | --------------- |
| `app-headless-cms`               | cms             |
| `app-file-manager`               | file-manager    |
| `app-security-access-management` | security        |
| `cognito`                        | admin-users     |
| `tenant-manager`                 | tenant-manager  |
| `app-record-locking`             | record-locking  |
| `app-audit-logs`                 | audit-logs      |
| `app-workflows`                  | workflows       |

### What to build

For each package: create a `features/permissions.ts` with `createPermissions`, register the feature, and update `<Security.Permissions>` to use the `.schema` from the DI result. For packages that already have `createUsePermissions` / `createHasPermission` consumers, update them to the DI-backed overload.

After all consumers are migrated, remove the deprecated `createUsePermissions(schema)` and `createHasPermission(schema)` overloads from `app-admin`.

### Acceptance criteria

- [ ] All 8 packages above use `createPermissions` + `RegisterFeature`
- [ ] Each package's `<Security.Permissions>` uses `.schema` from the DI result
- [ ] Deprecated `createUsePermissions(schema)` overload removed
- [ ] Deprecated `createHasPermission(schema)` overload removed
- [ ] All packages build: `yarn build`
- [ ] Existing permission tests pass across all packages
- [ ] Permission UI accordion renders correctly for all apps
