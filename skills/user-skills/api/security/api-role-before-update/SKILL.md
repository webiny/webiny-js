---
name: api-role-before-update
category: api/security
type: EventHandler
class: RoleBeforeUpdateEventHandler
import: webiny/api/security/role
description: >
  Intercept role update before it is persisted. Validate, transform, or reject.
---

# Role Before Update

Intercept role update before it is persisted. Validate, transform, or reject.

**Import:** `import { RoleBeforeUpdateEventHandler as Handler } from "webiny/api/security/role";`
**Fires:** Before role is updated
**Timing:** before

## Types

```typescript
import { RoleBeforeUpdateEventHandler as Handler } from "webiny/api/security/role";

// RoleBeforeUpdateEventHandler.Interface

// RoleBeforeUpdateEventHandler.Event

// RoleBeforeUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RoleBeforeUpdateEventHandler as Handler } from "webiny/api/security/role";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/role-before-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-role-after-update` — react after role update
- `dependency-injection` — inject Logger, BuildParams, and other services
