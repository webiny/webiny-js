---
name: api-role-before-delete
category: api/security
type: EventHandler
class: RoleBeforeDeleteEventHandler
import: webiny/api/security/role
description: >
  Intercept role delete before it is persisted. Validate, transform, or reject.
---

# Role Before Delete

Intercept role delete before it is persisted. Validate, transform, or reject.

**Import:** `import { RoleBeforeDeleteEventHandler as Handler } from "webiny/api/security/role";`
**Fires:** Before role is deleted
**Timing:** before

## Types

```typescript
import { RoleBeforeDeleteEventHandler as Handler } from "webiny/api/security/role";

// RoleBeforeDeleteEventHandler.Interface

// RoleBeforeDeleteEventHandler.Event

// RoleBeforeDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RoleBeforeDeleteEventHandler as Handler } from "webiny/api/security/role";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/role-before-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-role-after-delete` — react after role delete
- `dependency-injection` — inject Logger, BuildParams, and other services
