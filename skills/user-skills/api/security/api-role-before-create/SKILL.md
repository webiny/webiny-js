---
name: api-role-before-create
category: api/security
type: EventHandler
class: RoleBeforeCreateEventHandler
import: webiny/api/security/role
description: >
  Intercept role create before it is persisted. Validate, transform, or reject.
---

# Role Before Create

Intercept role create before it is persisted. Validate, transform, or reject.

**Import:** `import { RoleBeforeCreateEventHandler as Handler } from "webiny/api/security/role";`
**Fires:** Before role is created
**Timing:** before

## Types

```typescript
import { RoleBeforeCreateEventHandler as Handler } from "webiny/api/security/role";

// RoleBeforeCreateEventHandler.Interface

// RoleBeforeCreateEventHandler.Event

// RoleBeforeCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RoleBeforeCreateEventHandler as Handler } from "webiny/api/security/role";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/role-before-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-role-after-create` — react after role create
- `dependency-injection` — inject Logger, BuildParams, and other services
