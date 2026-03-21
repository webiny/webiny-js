---
name: api-api-key-before-create
category: api/security
type: EventHandler
class: ApiKeyBeforeCreateEventHandler
import: webiny/api/security/api-key
description: >
  Intercept apikey create before it is persisted. Validate, transform, or reject.
---

# Api Key Before Create

Intercept apikey create before it is persisted. Validate, transform, or reject.

**Import:** `import { ApiKeyBeforeCreateEventHandler as Handler } from "webiny/api/security/api-key";`
**Fires:** Before apikey is created
**Timing:** before

## Types

```typescript
import { ApiKeyBeforeCreateEventHandler as Handler } from "webiny/api/security/api-key";

// ApiKeyBeforeCreateEventHandler.Interface

// ApiKeyBeforeCreateEventHandler.Event

// ApiKeyBeforeCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ApiKeyBeforeCreateEventHandler as Handler } from "webiny/api/security/api-key";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/api-key-before-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-api-key-after-create` — react after apikey create
- `dependency-injection` — inject Logger, BuildParams, and other services
