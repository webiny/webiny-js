---
name: api-redirect-after-update
category: api/website-builder
type: EventHandler
class: RedirectAfterUpdateEventHandler
import: webiny/api/website-builder/redirect
description: >
  React after redirect is updated. Side effects, notifications, external sync.
---

# Redirect After Update

React after redirect is updated. Side effects, notifications, external sync.

**Import:** `import { RedirectAfterUpdateEventHandler as Handler } from "webiny/api/website-builder/redirect";`
**Fires:** After redirect is updated
**Timing:** after

## Types

```typescript
import { RedirectAfterUpdateEventHandler as Handler } from "webiny/api/website-builder/redirect";

// RedirectAfterUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// RedirectAfterUpdateEventHandler.Event
type Event = DomainEvent<RedirectAfterUpdatePayload>;

// RedirectAfterUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RedirectAfterUpdateEventHandler as Handler } from "webiny/api/website-builder/redirect";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/redirect-after-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-redirect-before-update` — intercept before redirect update
- `dependency-injection` — inject Logger, BuildParams, and other services
