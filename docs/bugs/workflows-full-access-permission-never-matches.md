# Workflows full access does not grant anything

**Packages:** `@webiny/api-workflows`, `@webiny/app-workflows`
**Found:** 2026-09-21

## What happens

Grant a group "Workflows: full access" in the admin. Members see no workflows editor in the
admin, and cannot create, update or delete workflows through the API. Only a full super-admin
(`name: "*"`) can.

Three separate faults, any one of which is enough to cause it.

## 1. The permission name never matches (both sides)

The admin stores the permission with a `.*` suffix:

```ts
// app-admin/src/permissions/usePermissionForm.ts:14-20
const name = `${schema.prefix}.*`;          // "workflows.*"
return { name, ...schema.fullAccess };      // { name: "workflows.*", editor: true }
```

Both sides ask for it without one:

```ts
// api-workflows/src/constants.ts:3
export const WORKFLOWS_PERMISSION = "workflows";

// app-workflows/src/presentation/permissions/constants.ts:1
export const WORKFLOWS_PERMISSION = "workflows";
```

Both lookups match by exact name or minimatch — `IdentityContext.ts:97-102` on the API side,
`app-admin/src/domain/Identity.ts:130` on the admin side. And the pattern does not match:

```
minimatch("workflows", "workflows.*")            // false
minimatch("workflows", "*")                      // true
```

So only a `*` permission is ever returned, and `permission.editor` is never reached for a
normally-granted group.

## 2. The admin compares against the wrong value

Even with the name fixed, the admin hook still fails:

```ts
// app-workflows/src/presentation/permissions/useWorkflowsPermission.ts:39
editor: permission.editor === WorkflowsSecurityPermissionAccessLevel.YES   // "yes"
```

```ts
// app-workflows/src/domain/permissionsSchema.ts:5
fullAccess: { editor: true }
```

`true === "yes"` is false. `HasWorkflowsEditorPermission` then renders nothing, so
`WorkflowsEditor` never appears.

## 3. Nothing tests it

Every api-workflows test authenticates with `{ name: "*" }`
(`__tests__/__helpers/handler.ts:96,129`), which matches, so the suite passes.

## Scope

- API: `CreateWorkflowUseCase`, `UpdateWorkflowUseCase`, `DeleteWorkflowUseCase`,
  `ListNotificationTypesUseCase` — every `ensureManageAccess` check.
- Admin: `useWorkflowsPermission`, and everything gated on it.

`api-audit-logs` does the same lookup correctly with `getPermissions("al.*")`.

## Fix

Query with the pattern the admin writes, in both packages:

```ts
export const WORKFLOWS_PERMISSION = "workflows.*";
```

Then either drop `WorkflowsSecurityPermissionAccessLevel` and compare `editor === true`, or
change the schema to emit `editor: "yes"`. The schema and the hook must agree.

Add a test that grants `{ name: "workflows.*", editor: true }` rather than `*`.

## Related

Reviewer routing adds a `workflows.reassign` permission entity. That one *would* match
(`minimatch("workflows.reassign", "workflows.*") === true`), producing the odd result that a
full-access editor could reassign a review but not edit a workflow. Fix this first.
