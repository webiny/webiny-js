# Deleting a tenant leaves its content in storage, unreachable

> **Package:** `@webiny/api-core` (`DeleteTenantUseCase`), `@webiny/tenant-manager`
> (`DeleteTenantOnEntryDeleteHandler`)
> **Severity:** a platform behaviour to know before deleting a tenant that holds real content. Not a
> cleanup task.
> **Status:** open, observed 2026-10-09. Not a defect report: nobody has decided what deletion should
> remove.

## What happens

A tenant is deleted by permanently deleting its Tenant Manager entry. `DeleteTenantOnEntryDeleteHandler`
then calls core `DeleteTenantUseCase`, which:

- deletes the tenant's record;
- publishes `TenantBeforeDeleteEvent` and `TenantAfterDeleteEvent`.

Nothing in that path removes the tenant's content. Its Website Builder pages, Library components, File
Manager entries and S3 objects (`tenants/{id}/files/...`), CMS entries and key-value records stay where
they are. Cleaning them up would be up to whatever subscribes to the delete events, and nothing was seen
doing so.

Once the tenant record is gone, that content cannot be reached through the API:

- a request addressed to the tenant fails as an unknown tenant (currently a plain 500);
- so nothing can list it, export it or delete it afterwards.

The handler also swallows a failed core delete (`console.error`, no throw), so the Tenant Manager
entry can go while the core tenant stays.

## Where it was seen

The component-extraction spike tenant `cespike1` (2026-10-09) held:

- 4 Library components;
- one active theme;
- 1 File Manager file, and its S3 object;
- 1 published page.

After `deleteTenant(revision: "cespike1#0001", options: { permanently: true })` through the CMS manage
API:

- the Tenant Manager entry no longer lists;
- a request with `x-tenant: cespike1` returns "Internal server error" (the unknown-tenant path);
- the content above was not observed being removed, and can no longer be read to check.

## Before deleting a tenant with real content

- Export or delete what it holds first, while it can still be addressed.
- Expect its storage to remain, billed and unreachable, if that is not done.
- Check the core tenant is really gone afterwards: the handler does not report a failed delete.

## Not established

- Whether any subscriber to `TenantAfterDeleteEvent` cleans up anything (none was found by reading;
  none was traced at runtime).
- What should be removed, and whether some content should outlive the tenant (audit records, for one).
