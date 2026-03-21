---
name: api-tenant-after-create
category: api/tenancy
type: EventHandler
class: TenantAfterCreateEventHandler
import: webiny/api/tenancy
description: >
  React after tenant is created. Side effects, notifications, external sync.
---

# Tenant After Create

React after tenant is created. Side effects, notifications, external sync.

**Import:** `import { TenantAfterCreateEventHandler as Handler } from "webiny/api/tenancy";`
**Fires:** After tenant is created
**Timing:** after

## Types

```typescript
import { TenantAfterCreateEventHandler as Handler } from "webiny/api/tenancy";

// TenantAfterCreateEventHandler.Interface

// TenantAfterCreateEventHandler.Event

// TenantAfterCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { TenantAfterCreateEventHandler as Handler } from "webiny/api/tenancy";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/tenant-after-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-tenant-before-create` — intercept before tenant create
- `dependency-injection` — inject Logger, BuildParams, and other services
