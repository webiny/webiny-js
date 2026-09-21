# Workflows full access does not grant anything through the API

**Package:** `@webiny/api-workflows`
**Found:** 2026-09-21

## What happens

Grant a group "Workflows: full access" in the admin. Members still cannot create, update or
delete workflows. Only a full super-admin (`name: "*"`) can.

## Why

The admin stores the permission with a `.*` suffix:

```ts
// app-admin/src/permissions/usePermissionForm.ts:15-21
const name = `${schema.prefix}.*`;          // "workflows.*"
return { name, ...schema.fullAccess };      // { name: "workflows.*", editor: true }
```

The API asks for it without one:

```ts
// api-workflows/src/constants.ts:3
export const WORKFLOWS_PERMISSION = "workflows";

// api-workflows/src/features/workflow/CreateWorkflowUseCase.ts:54
await this.identityContext.getPermissions<IWorkflowsSecurityPermission>(WORKFLOWS_PERMISSION);
```

`getPermissions` matches by exact name or minimatch:

```ts
// api-core/src/features/security/IdentityContext/IdentityContext.ts:97-102
return permissions.filter(p => {
    if (p.name === name) {
        return true;
    }
    return minimatch(name, p.name);
});
```

And the pattern does not match:

```
minimatch("workflows", "workflows.*")            // false
minimatch("workflows", "*")                      // true
```

So only a `*` permission is ever returned. `permission.editor` is never reached for a
normally-granted group.

## Why no test catches it

Every api-workflows test authenticates with `{ name: "*" }`
(`__tests__/__helpers/handler.ts:96,129`), which matches.

## Scope

`api-workflows` only. `api-audit-logs` does the same lookup correctly with
`getPermissions("al.*")`.

Affects `CreateWorkflowUseCase`, `UpdateWorkflowUseCase`, `DeleteWorkflowUseCase` and
`ListNotificationTypesUseCase` — every `ensureManageAccess` check in the package.

## Fix

Query with the pattern the admin writes:

```ts
export const WORKFLOWS_PERMISSION = "workflows.*";
```

Then add a test that grants `{ name: "workflows.*", editor: true }` rather than `*`.

## Related

Reviewer routing adds a `workflows.reassign` permission entity. That one *would* match
(`minimatch("workflows.reassign", "workflows.*") === true`), producing the odd result that a
full-access editor could reassign a review but not edit a workflow. Fix this first.
