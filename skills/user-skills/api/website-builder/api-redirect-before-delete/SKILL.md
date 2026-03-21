---
name: api-redirect-before-delete
category: api/website-builder
type: EventHandler
class: RedirectBeforeDeleteEventHandler
import: webiny/api/website-builder/redirect
description: >
  Intercept redirect delete before it is persisted. Validate, transform, or reject.
---

# Redirect Before Delete

Intercept redirect delete before it is persisted. Validate, transform, or reject.

**Import:** `import { RedirectBeforeDeleteEventHandler as Handler } from "webiny/api/website-builder/redirect";`
**Fires:** Before redirect is deleted
**Timing:** before

## Types

```typescript
import { RedirectBeforeDeleteEventHandler as Handler } from "webiny/api/website-builder/redirect";

// RedirectBeforeDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// RedirectBeforeDeleteEventHandler.Event
type Event = DomainEvent<RedirectBeforeDeletePayload>;

// RedirectBeforeDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RedirectBeforeDeleteEventHandler as Handler } from "webiny/api/website-builder/redirect";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/redirect-before-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-redirect-after-delete` — react after redirect delete
- `dependency-injection` — inject Logger, BuildParams, and other services
