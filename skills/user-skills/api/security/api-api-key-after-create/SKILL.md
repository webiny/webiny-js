---
name: api-api-key-after-create
category: api/security
type: EventHandler
class: ApiKeyAfterCreateEventHandler
import: webiny/api/security/api-key
description: >
  React after apikey is created. Side effects, notifications, external sync.
---

# Api Key After Create

React after apikey is created. Side effects, notifications, external sync.

**Import:** `import { ApiKeyAfterCreateEventHandler as Handler } from "webiny/api/security/api-key";`
**Fires:** After apikey is created
**Timing:** after

## Types

```typescript
import { ApiKeyAfterCreateEventHandler as Handler } from "webiny/api/security/api-key";

// ApiKeyAfterCreateEventHandler.Interface

// ApiKeyAfterCreateEventHandler.Event

// ApiKeyAfterCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ApiKeyAfterCreateEventHandler as Handler } from "webiny/api/security/api-key";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/api-key-after-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-api-key-before-create` — intercept before apikey create
- `dependency-injection` — inject Logger, BuildParams, and other services
