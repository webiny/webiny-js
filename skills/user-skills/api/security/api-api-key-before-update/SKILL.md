---
name: api-api-key-before-update
category: api/security
type: EventHandler
class: ApiKeyBeforeUpdateEventHandler
import: webiny/api/security/api-key
description: >
  Intercept apikey update before it is persisted. Validate, transform, or reject.
---

# Api Key Before Update

Intercept apikey update before it is persisted. Validate, transform, or reject.

**Import:** `import { ApiKeyBeforeUpdateEventHandler as Handler } from "webiny/api/security/api-key";`
**Fires:** Before apikey is updated
**Timing:** before

## Types

```typescript
import { ApiKeyBeforeUpdateEventHandler as Handler } from "webiny/api/security/api-key";

// ApiKeyBeforeUpdateEventHandler.Interface

// ApiKeyBeforeUpdateEventHandler.Event

// ApiKeyBeforeUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ApiKeyBeforeUpdateEventHandler as Handler } from "webiny/api/security/api-key";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/api-key-before-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-api-key-after-update` — react after apikey update
- `dependency-injection` — inject Logger, BuildParams, and other services
