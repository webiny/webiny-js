---
name: api-redirect-before-move
category: api/website-builder
type: EventHandler
class: RedirectBeforeMoveEventHandler
import: webiny/api/website-builder/redirect
description: >
  Intercept redirect move before it is persisted. Validate, transform, or reject.
---

# Redirect Before Move

Intercept redirect move before it is persisted. Validate, transform, or reject.

**Import:** `import { RedirectBeforeMoveEventHandler as Handler } from "webiny/api/website-builder/redirect";`
**Fires:** Before redirect is moved
**Timing:** before

## Types

```typescript
import { RedirectBeforeMoveEventHandler as Handler } from "webiny/api/website-builder/redirect";

// RedirectBeforeMoveEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// RedirectBeforeMoveEventHandler.Event
type Event = DomainEvent<RedirectBeforeMovePayload>;

// RedirectBeforeMoveEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RedirectBeforeMoveEventHandler as Handler } from "webiny/api/website-builder/redirect";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/redirect-before-move.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-redirect-after-move` — react after redirect move
- `dependency-injection` — inject Logger, BuildParams, and other services
