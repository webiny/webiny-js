---
name: api-redirect-before-update
category: api/website-builder
type: EventHandler
class: RedirectBeforeUpdateEventHandler
import: webiny/api/website-builder/redirect
description: >
  Intercept redirect update before it is persisted. Validate, transform, or reject.
---

# Redirect Before Update

Intercept redirect update before it is persisted. Validate, transform, or reject.

**Import:** `import { RedirectBeforeUpdateEventHandler as Handler } from "webiny/api/website-builder/redirect";`
**Fires:** Before redirect is updated
**Timing:** before

## Types

```typescript
import { RedirectBeforeUpdateEventHandler as Handler } from "webiny/api/website-builder/redirect";

// RedirectBeforeUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// RedirectBeforeUpdateEventHandler.Event
type Event = DomainEvent<RedirectBeforeUpdatePayload>;

// RedirectBeforeUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RedirectBeforeUpdateEventHandler as Handler } from "webiny/api/website-builder/redirect";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/redirect-before-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-redirect-after-update` — react after redirect update
- `dependency-injection` — inject Logger, BuildParams, and other services
