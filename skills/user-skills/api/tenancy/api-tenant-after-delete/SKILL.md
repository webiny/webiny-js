---
name: api-tenant-after-delete
category: api/tenancy
type: EventHandler
class: TenantAfterDeleteEventHandler
import: webiny/api/tenancy
description: >
  React after tenant is deleted. Side effects, notifications, external sync.
---

# Tenant After Delete

React after tenant is deleted. Side effects, notifications, external sync.

**Import:** `import { TenantAfterDeleteEventHandler as Handler } from "webiny/api/tenancy";`
**Fires:** After tenant is deleted
**Timing:** after

## Types

```typescript
import { TenantAfterDeleteEventHandler as Handler } from "webiny/api/tenancy";

// TenantAfterDeleteEventHandler.Interface

// TenantAfterDeleteEventHandler.Event

// TenantAfterDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { TenantAfterDeleteEventHandler as Handler } from "webiny/api/tenancy";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/tenant-after-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-tenant-before-delete` — intercept before tenant delete
- `dependency-injection` — inject Logger, BuildParams, and other services
