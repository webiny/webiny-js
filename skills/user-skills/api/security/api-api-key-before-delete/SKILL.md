---
name: api-api-key-before-delete
category: api/security
type: EventHandler
class: ApiKeyBeforeDeleteEventHandler
import: webiny/api/security/api-key
description: >
  Intercept apikey delete before it is persisted. Validate, transform, or reject.
---

# Api Key Before Delete

Intercept apikey delete before it is persisted. Validate, transform, or reject.

**Import:** `import { ApiKeyBeforeDeleteEventHandler as Handler } from "webiny/api/security/api-key";`
**Fires:** Before apikey is deleted
**Timing:** before

## Types

```typescript
import { ApiKeyBeforeDeleteEventHandler as Handler } from "webiny/api/security/api-key";

// ApiKeyBeforeDeleteEventHandler.Interface

// ApiKeyBeforeDeleteEventHandler.Event

// ApiKeyBeforeDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ApiKeyBeforeDeleteEventHandler as Handler } from "webiny/api/security/api-key";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/api-key-before-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-api-key-after-delete` — react after apikey delete
- `dependency-injection` — inject Logger, BuildParams, and other services
