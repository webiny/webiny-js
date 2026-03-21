---
name: api-tenant-before-update
category: api/tenancy
type: EventHandler
class: TenantBeforeUpdateEventHandler
import: webiny/api/tenancy
description: >
  Intercept tenant update before it is persisted. Validate, transform, or reject.
---

# Tenant Before Update

Intercept tenant update before it is persisted. Validate, transform, or reject.

**Import:** `import { TenantBeforeUpdateEventHandler as Handler } from "webiny/api/tenancy";`
**Fires:** Before tenant is updated
**Timing:** before

## Types

```typescript
import { TenantBeforeUpdateEventHandler as Handler } from "webiny/api/tenancy";

// TenantBeforeUpdateEventHandler.Interface

// TenantBeforeUpdateEventHandler.Event

// TenantBeforeUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { TenantBeforeUpdateEventHandler as Handler } from "webiny/api/tenancy";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/tenant-before-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-tenant-after-update` — react after tenant update
- `dependency-injection` — inject Logger, BuildParams, and other services
