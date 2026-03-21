---
name: api-redirect-after-delete
category: api/website-builder
type: EventHandler
class: RedirectAfterDeleteEventHandler
import: webiny/api/website-builder/redirect
description: >
  React after redirect is deleted. Side effects, notifications, external sync.
---

# Redirect After Delete

React after redirect is deleted. Side effects, notifications, external sync.

**Import:** `import { RedirectAfterDeleteEventHandler as Handler } from "webiny/api/website-builder/redirect";`
**Fires:** After redirect is deleted
**Timing:** after

## Types

```typescript
import { RedirectAfterDeleteEventHandler as Handler } from "webiny/api/website-builder/redirect";

// RedirectAfterDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// RedirectAfterDeleteEventHandler.Event
type Event = DomainEvent<RedirectAfterDeletePayload>;

// RedirectAfterDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RedirectAfterDeleteEventHandler as Handler } from "webiny/api/website-builder/redirect";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/redirect-after-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-redirect-before-delete` — intercept before redirect delete
- `dependency-injection` — inject Logger, BuildParams, and other services
