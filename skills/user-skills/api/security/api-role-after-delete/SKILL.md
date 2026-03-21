---
name: api-role-after-delete
category: api/security
type: EventHandler
class: RoleAfterDeleteEventHandler
import: webiny/api/security/role
description: >
  React after role is deleted. Side effects, notifications, external sync.
---

# Role After Delete

React after role is deleted. Side effects, notifications, external sync.

**Import:** `import { RoleAfterDeleteEventHandler as Handler } from "webiny/api/security/role";`
**Fires:** After role is deleted
**Timing:** after

## Types

```typescript
import { RoleAfterDeleteEventHandler as Handler } from "webiny/api/security/role";

// RoleAfterDeleteEventHandler.Interface

// RoleAfterDeleteEventHandler.Event

// RoleAfterDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RoleAfterDeleteEventHandler as Handler } from "webiny/api/security/role";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/role-after-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-role-before-delete` — intercept before role delete
- `dependency-injection` — inject Logger, BuildParams, and other services
