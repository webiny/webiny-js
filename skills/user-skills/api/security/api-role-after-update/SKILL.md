---
name: api-role-after-update
category: api/security
type: EventHandler
class: RoleAfterUpdateEventHandler
import: webiny/api/security/role
description: >
  React after role is updated. Side effects, notifications, external sync.
---

# Role After Update

React after role is updated. Side effects, notifications, external sync.

**Import:** `import { RoleAfterUpdateEventHandler as Handler } from "webiny/api/security/role";`
**Fires:** After role is updated
**Timing:** after

## Types

```typescript
import { RoleAfterUpdateEventHandler as Handler } from "webiny/api/security/role";

// RoleAfterUpdateEventHandler.Interface

// RoleAfterUpdateEventHandler.Event

// RoleAfterUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RoleAfterUpdateEventHandler as Handler } from "webiny/api/security/role";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/role-after-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-role-before-update` — intercept before role update
- `dependency-injection` — inject Logger, BuildParams, and other services
