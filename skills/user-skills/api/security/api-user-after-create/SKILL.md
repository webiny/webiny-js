---
name: api-user-after-create
category: api/security
type: EventHandler
class: UserAfterCreateEventHandler
import: webiny/api/security/user
description: >
  React after user is created. Side effects, notifications, external sync.
---

# User After Create

React after user is created. Side effects, notifications, external sync.

**Import:** `import { UserAfterCreateEventHandler as Handler } from "webiny/api/security/user";`
**Fires:** After user is created
**Timing:** after

## Types

```typescript
import { UserAfterCreateEventHandler as Handler } from "webiny/api/security/user";

// UserAfterCreateEventHandler.Interface

// UserAfterCreateEventHandler.Event

// UserAfterCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UserAfterCreateEventHandler as Handler } from "webiny/api/security/user";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/user-after-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-user-before-create` — intercept before user create
- `dependency-injection` — inject Logger, BuildParams, and other services
