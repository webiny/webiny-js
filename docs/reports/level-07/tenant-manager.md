# @webiny/tenant-manager

> Level 7 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/tenant-manager` is the admin-facing feature that lets a super-admin create, install, enable, disable and browse tenants: it models a "Tenant" as a hidden, `.public()` headless-CMS content model (`TenantModel.ts`), wraps create/update/enable/disable/get flows in the repo's usual UseCase→Repository DI pattern, mirrors state into `@webiny/api-core`'s own `Tenancy` feature (the actual tenant registry that everything else keys off), and ships the admin UI (tenant list, selector, enable/disable/install dialogs, `IsRootTenant`/`IsNotRootTenant` gates). There is no real parent/child hierarchy in this package: every tenant is created as a direct child of `"root"` (hardcoded). Two security findings are tracked privately (SEC-34, SEC-35). The package has zero automated tests. It correctly reuses `@webiny/api-headless-cms`'s model-builder/entry use cases rather than reimplementing storage, and does not touch the level-4/5 `TenantCache` dataloader (SEC-14) or the `WebinySdk` stale-tenant bug (SEC-16) directly.

## Public API

- `CreateTenantUseCase` / `CreateAndInstallTenantUseCase` / `UpdateTenantUseCase` / `EnableTenantUseCase` / `DisableTenantUseCase` / `GetTenantByIdUseCase` / `GetCurrentTenantUseCase` (`exports/api/tenant-manager.ts`) — the DI abstractions behind the four GraphQL mutations (`createTenant`, `installTenant` (which wraps create+install), `enableTenant`, `disableTenant`) and internal lookups; consumed only within this package and re-exported unmodified from `packages/webiny/src/api/tenant-manager.ts`.
- `TenantModelExtension` (`api/domain/TenantModelExtension.ts`) — lets other packages add fields to the "Tenant" model; 2 real implementers found via codegraph: `packages/api-website-builder/src/features/tenantManager/TenantModelExtension.ts` and a project-level `extensions/tenantTheme/TenantThemeExtension.ts`.
- `useCurrentTenant`, `useEnableTenant`, `useDisableTenant`, `IsRootTenant`/`IsNotRootTenant`/`IsTenant` (`exports/admin/tenancy.ts`) — re-exported via `packages/webiny/src/admin/tenancy.ts`; `IsRootTenant` has ~4 real call sites (gating the tenant-management UI itself), `IsNotRootTenant` has none found by codegraph beyond its own definition (see Dead code).
- `TenantSelector` (`admin/TenantSelector.tsx`) — a thin decorator (adds a "copy tenant ID" tooltip) around `@webiny/app-admin`'s `TenantSelector`; the actual tenant-switch mechanism lives in `app-admin` (audited at level 3), not here.

## Bugs

| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | critical | `packages/tenant-manager/src/api/features/AddCmsPermissions/AddCmsPermissions.ts` | Security finding SEC-34 — see private notes. | — | high |
| 2 | high | `packages/tenant-manager/src/api/features/CreateTenant/CreateTenantUseCase.ts`, `.../DisableTenant/DisableTenantUseCase.ts`, `.../EnableTenant/EnableTenantUseCase.ts` | Security finding SEC-35 — see private notes. | — | high |
| 3 | medium | `packages/tenant-manager/src/api/features/DeleteTenantOnEntryDelete/DeleteTenantOnEntryDeleteHandler.ts:21-27` | The handler that cascades a permanent "Tenant" entry deletion into the real `api-core` tenant deletion (`this.deleteTenant.execute(entry.entryId)`) wraps the call in a `try/catch` that only `console.error`s on failure and never rethrows or compensates. If the CMS entry delete has already committed (this runs on `EntryAfterDeleteEventHandler`, i.e. after the fact) and the subsequent `api-core` tenant deletion throws (e.g. a downstream resource-cleanup step fails), the tenant-manager admin UI loses all record of the tenant (its CMS entry is gone) while the actual `api-core` tenant record — and everything scoped to it — silently keeps existing, now unreachable through this package's UI or GraphQL API (`GetTenantById` can no longer find it, since its CMS entry is gone). | An operator permanently deletes a tenant from the Tenant Manager UI; the underlying `api-core` delete throws (e.g. because a resource it owns can't be cleaned up); the operator sees the tenant disappear from the list with no error, but the orphaned tenant and its data remain live and un-manageable. | medium |
| 4 | low | `packages/tenant-manager/src/api/features/UpdateTenant/UpdateTenantUseCase.ts:9-24` | Unlike every sibling use case in this package (`CreateTenantUseCase`, `DisableTenantUseCase`, `EnableTenantUseCase`), `UpdateTenantUseCase.execute` performs no authorization check at all — it just delegates straight to the repository. Today it is only ever invoked internally by callers (`DisableTenantUseCase`, `EnableTenantUseCase`, `CreateAndInstallTenantUseCase`) that already gate on `tm.tenant` themselves, and it is not wired to any GraphQL resolver directly, so it is not externally reachable right now. It is, however, a public export (`exports/api/tenant-manager.ts`) that any future internal or extension code can call directly with no permission enforcement of its own. | A future feature or extension that resolves `UpdateTenantUseCase` from the container and calls it directly (as `CreateAndInstallTenantUseCase` already does) without independently re-checking `tm.tenant` would let any authenticated identity rewrite a tenant's `name`/`description`/`status`/`isInstalled` fields with no permission check. | medium |

## Duplication

- `DisableTenantUseCase.ts` and `EnableTenantUseCase.ts` are near carbon copies of each other (jscpd: three separate clone blocks totaling ~35 of ~66 lines each) — same constructor dependency list, same `getPermission("tm.tenant")` check, same get-tenant → publish-before-event → update api-core → update CMS entry → publish-after-event shape, differing only in the target `status` string and event class names. A shared `SetTenantStatusUseCase` helper parameterized by status would remove this.
- `DisableTenantSchema.ts` and `EnableTenantSchema.ts` each duplicate ~17 lines of resolver-wiring boilerplate that also appears in `InstallTenantSchema.ts` (jscpd-confirmed), all three following the identical `builder.addResolver` → `ErrorResponse`/`Response(true)` pattern.
- `GetTenantByIdRepository.ts:22-29` and `UpdateTenantRepository.ts:24-32` duplicate the "resolve the Tenant model, then fail with a typed error if missing" boilerplate (jscpd: 8 lines) — both could share a small `getTenantModelOrFail()` helper.

## Dead code

- `IsNotRootTenant` (`admin/IsRootTenant.tsx:34-36`) — exported from `exports/admin/tenancy.ts` and re-exported by `packages/webiny/src/admin/tenancy.ts`, but codegraph shows no consumers anywhere in the monorepo beyond its own definition (only its sibling `IsRootTenant` has real callers). Likely intended as a symmetry export for extension authors; currently unused.

## Convention issues

None of significance found — DI implementation files follow the class-name-matches-export convention consistently (`CreateTenantUseCase`, `DisableTenantUseCase`, etc.), and each feature folder keeps its abstraction/implementation/feature-registration split per the project's DI pattern.

## Test gaps

There is no `__tests__` directory anywhere in this package — zero automated tests for tenant creation, install, enable/disable, the CMS-entry-delete-to-tenant-delete cascade, or any permission check described above. Given this package's role (tenant lifecycle and the permission side-effects described in Bugs #1/#2), this is a significant gap: none of the authorization checks, the disable/enable event publishing, or the delete-cascade error-swallowing behavior has any regression protection.

## Recommendations

1. Address security findings SEC-34 and SEC-35 (see private notes).
2. Add test coverage for the tenant lifecycle (create → install → disable → enable → delete-cascade), including a test that asserts `DeleteTenantOnEntryDeleteHandler` surfaces or compensates for a failed `api-core` deletion instead of silently swallowing it.
3. De-duplicate `DisableTenantUseCase`/`EnableTenantUseCase` (and their GraphQL schema wiring) into a single status-parameterized use case, and remove or document the unused `IsNotRootTenant` export.
