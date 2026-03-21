---
name: api-role-after-create
category: api/security
type: EventHandler
class: RoleAfterCreateEventHandler
import: webiny/api/security/role
description: >
  React after role is created. Side effects, notifications, external sync.
---

# Role After Create

React after role is created. Side effects, notifications, external sync.

**Import:** `import { RoleAfterCreateEventHandler as Handler } from "webiny/api/security/role";`
**Fires:** After role is created
**Timing:** after

## Types

```typescript
import { RoleAfterCreateEventHandler as Handler } from "webiny/api/security/role";

// RoleAfterCreateEventHandler.Interface

// RoleAfterCreateEventHandler.Event

// RoleAfterCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RoleAfterCreateEventHandler as Handler } from "webiny/api/security/role";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/role-after-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-role-before-create` — intercept before role create
- `dependency-injection` — inject Logger, BuildParams, and other services
