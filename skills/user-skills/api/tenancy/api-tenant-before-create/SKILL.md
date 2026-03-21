---
name: api-tenant-before-create
category: api/tenancy
type: EventHandler
class: TenantBeforeCreateEventHandler
import: webiny/api/tenancy
description: >
  Intercept tenant create before it is persisted. Validate, transform, or reject.
---

# Tenant Before Create

Intercept tenant create before it is persisted. Validate, transform, or reject.

**Import:** `import { TenantBeforeCreateEventHandler as Handler } from "webiny/api/tenancy";`
**Fires:** Before tenant is created
**Timing:** before

## Types

```typescript
import { TenantBeforeCreateEventHandler as Handler } from "webiny/api/tenancy";

// TenantBeforeCreateEventHandler.Interface

// TenantBeforeCreateEventHandler.Event

// TenantBeforeCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { TenantBeforeCreateEventHandler as Handler } from "webiny/api/tenancy";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/tenant-before-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-tenant-after-create` — react after tenant create
- `dependency-injection` — inject Logger, BuildParams, and other services
