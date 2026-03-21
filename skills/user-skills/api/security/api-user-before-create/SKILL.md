---
name: api-user-before-create
category: api/security
type: EventHandler
class: UserBeforeCreateEventHandler
import: webiny/api/security/user
description: >
  Intercept user create before it is persisted. Validate, transform, or reject.
---

# User Before Create

Intercept user create before it is persisted. Validate, transform, or reject.

**Import:** `import { UserBeforeCreateEventHandler as Handler } from "webiny/api/security/user";`
**Fires:** Before user is created
**Timing:** before

## Types

```typescript
import { UserBeforeCreateEventHandler as Handler } from "webiny/api/security/user";

// UserBeforeCreateEventHandler.Interface

// UserBeforeCreateEventHandler.Event

// UserBeforeCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UserBeforeCreateEventHandler as Handler } from "webiny/api/security/user";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/user-before-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-user-after-create` — react after user create
- `dependency-injection` — inject Logger, BuildParams, and other services
