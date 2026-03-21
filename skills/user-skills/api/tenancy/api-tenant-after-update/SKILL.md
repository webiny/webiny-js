---
name: api-tenant-after-update
category: api/tenancy
type: EventHandler
class: TenantAfterUpdateEventHandler
import: webiny/api/tenancy
description: >
  React after tenant is updated. Side effects, notifications, external sync.
---

# Tenant After Update

React after tenant is updated. Side effects, notifications, external sync.

**Import:** `import { TenantAfterUpdateEventHandler as Handler } from "webiny/api/tenancy";`
**Fires:** After tenant is updated
**Timing:** after

## Types

```typescript
import { TenantAfterUpdateEventHandler as Handler } from "webiny/api/tenancy";

// TenantAfterUpdateEventHandler.Interface

// TenantAfterUpdateEventHandler.Event

// TenantAfterUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { TenantAfterUpdateEventHandler as Handler } from "webiny/api/tenancy";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/tenant-after-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-tenant-before-update` — intercept before tenant update
- `dependency-injection` — inject Logger, BuildParams, and other services
