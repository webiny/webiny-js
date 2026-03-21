---
name: api-user-after-update
category: api/security
type: EventHandler
class: UserAfterUpdateEventHandler
import: webiny/api/security/user
description: >
  React after user is updated. Side effects, notifications, external sync.
---

# User After Update

React after user is updated. Side effects, notifications, external sync.

**Import:** `import { UserAfterUpdateEventHandler as Handler } from "webiny/api/security/user";`
**Fires:** After user is updated
**Timing:** after

## Types

```typescript
import { UserAfterUpdateEventHandler as Handler } from "webiny/api/security/user";

// UserAfterUpdateEventHandler.Interface

// UserAfterUpdateEventHandler.Event

// UserAfterUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UserAfterUpdateEventHandler as Handler } from "webiny/api/security/user";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/user-after-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-user-before-update` — intercept before user update
- `dependency-injection` — inject Logger, BuildParams, and other services
