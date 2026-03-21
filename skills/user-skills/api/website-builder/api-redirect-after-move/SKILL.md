---
name: api-redirect-after-move
category: api/website-builder
type: EventHandler
class: RedirectAfterMoveEventHandler
import: webiny/api/website-builder/redirect
description: >
  React after redirect is moved. Side effects, notifications, external sync.
---

# Redirect After Move

React after redirect is moved. Side effects, notifications, external sync.

**Import:** `import { RedirectAfterMoveEventHandler as Handler } from "webiny/api/website-builder/redirect";`
**Fires:** After redirect is moved
**Timing:** after

## Types

```typescript
import { RedirectAfterMoveEventHandler as Handler } from "webiny/api/website-builder/redirect";

// RedirectAfterMoveEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// RedirectAfterMoveEventHandler.Event
type Event = DomainEvent<RedirectAfterMovePayload>;

// RedirectAfterMoveEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RedirectAfterMoveEventHandler as Handler } from "webiny/api/website-builder/redirect";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/redirect-after-move.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-redirect-before-move` — intercept before redirect move
- `dependency-injection` — inject Logger, BuildParams, and other services
