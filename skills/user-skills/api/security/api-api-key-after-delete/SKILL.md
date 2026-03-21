---
name: api-api-key-after-delete
category: api/security
type: EventHandler
class: ApiKeyAfterDeleteEventHandler
import: webiny/api/security/api-key
description: >
  React after apikey is deleted. Side effects, notifications, external sync.
---

# Api Key After Delete

React after apikey is deleted. Side effects, notifications, external sync.

**Import:** `import { ApiKeyAfterDeleteEventHandler as Handler } from "webiny/api/security/api-key";`
**Fires:** After apikey is deleted
**Timing:** after

## Types

```typescript
import { ApiKeyAfterDeleteEventHandler as Handler } from "webiny/api/security/api-key";

// ApiKeyAfterDeleteEventHandler.Interface

// ApiKeyAfterDeleteEventHandler.Event

// ApiKeyAfterDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ApiKeyAfterDeleteEventHandler as Handler } from "webiny/api/security/api-key";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/api-key-after-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-api-key-before-delete` — intercept before apikey delete
- `dependency-injection` — inject Logger, BuildParams, and other services
