---
name: api-tenant-before-delete
category: api/tenancy
type: EventHandler
class: TenantBeforeDeleteEventHandler
import: webiny/api/tenancy
description: >
  Intercept tenant delete before it is persisted. Validate, transform, or reject.
---

# Tenant Before Delete

Intercept tenant delete before it is persisted. Validate, transform, or reject.

**Import:** `import { TenantBeforeDeleteEventHandler as Handler } from "webiny/api/tenancy";`
**Fires:** Before tenant is deleted
**Timing:** before

## Types

```typescript
import { TenantBeforeDeleteEventHandler as Handler } from "webiny/api/tenancy";

// TenantBeforeDeleteEventHandler.Interface

// TenantBeforeDeleteEventHandler.Event

// TenantBeforeDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { TenantBeforeDeleteEventHandler as Handler } from "webiny/api/tenancy";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/tenant-before-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-tenant-after-delete` — react after tenant delete
- `dependency-injection` — inject Logger, BuildParams, and other services
