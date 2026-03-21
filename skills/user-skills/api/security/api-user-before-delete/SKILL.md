---
name: api-user-before-delete
category: api/security
type: EventHandler
class: UserBeforeDeleteEventHandler
import: webiny/api/security/user
description: >
  Intercept user delete before it is persisted. Validate, transform, or reject.
---

# User Before Delete

Intercept user delete before it is persisted. Validate, transform, or reject.

**Import:** `import { UserBeforeDeleteEventHandler as Handler } from "webiny/api/security/user";`
**Fires:** Before user is deleted
**Timing:** before

## Types

```typescript
import { UserBeforeDeleteEventHandler as Handler } from "webiny/api/security/user";

// UserBeforeDeleteEventHandler.Interface

// UserBeforeDeleteEventHandler.Event

// UserBeforeDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UserBeforeDeleteEventHandler as Handler } from "webiny/api/security/user";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/user-before-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-user-after-delete` — react after user delete
- `dependency-injection` — inject Logger, BuildParams, and other services
