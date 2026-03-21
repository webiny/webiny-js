---
name: api-user-after-delete
category: api/security
type: EventHandler
class: UserAfterDeleteEventHandler
import: webiny/api/security/user
description: >
  React after user is deleted. Side effects, notifications, external sync.
---

# User After Delete

React after user is deleted. Side effects, notifications, external sync.

**Import:** `import { UserAfterDeleteEventHandler as Handler } from "webiny/api/security/user";`
**Fires:** After user is deleted
**Timing:** after

## Types

```typescript
import { UserAfterDeleteEventHandler as Handler } from "webiny/api/security/user";

// UserAfterDeleteEventHandler.Interface

// UserAfterDeleteEventHandler.Event

// UserAfterDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UserAfterDeleteEventHandler as Handler } from "webiny/api/security/user";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/user-after-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-user-before-delete` — intercept before user delete
- `dependency-injection` — inject Logger, BuildParams, and other services
