---
name: api-api-key-after-update
category: api/security
type: EventHandler
class: ApiKeyAfterUpdateEventHandler
import: webiny/api/security/api-key
description: >
  React after apikey is updated. Side effects, notifications, external sync.
---

# Api Key After Update

React after apikey is updated. Side effects, notifications, external sync.

**Import:** `import { ApiKeyAfterUpdateEventHandler as Handler } from "webiny/api/security/api-key";`
**Fires:** After apikey is updated
**Timing:** after

## Types

```typescript
import { ApiKeyAfterUpdateEventHandler as Handler } from "webiny/api/security/api-key";

// ApiKeyAfterUpdateEventHandler.Interface

// ApiKeyAfterUpdateEventHandler.Event

// ApiKeyAfterUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ApiKeyAfterUpdateEventHandler as Handler } from "webiny/api/security/api-key";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/api-key-after-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-api-key-before-update` — intercept before apikey update
- `dependency-injection` — inject Logger, BuildParams, and other services
