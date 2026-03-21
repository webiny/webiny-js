---
name: api-redirect-after-create
category: api/website-builder
type: EventHandler
class: RedirectAfterCreateEventHandler
import: webiny/api/website-builder/redirect
description: >
  React after redirect is created. Side effects, notifications, external sync.
---

# Redirect After Create

React after redirect is created. Side effects, notifications, external sync.

**Import:** `import { RedirectAfterCreateEventHandler as Handler } from "webiny/api/website-builder/redirect";`
**Fires:** After redirect is created
**Timing:** after

## Types

```typescript
import { RedirectAfterCreateEventHandler as Handler } from "webiny/api/website-builder/redirect";

// RedirectAfterCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// RedirectAfterCreateEventHandler.Event
type Event = DomainEvent<RedirectAfterCreatePayload>;

// RedirectAfterCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RedirectAfterCreateEventHandler as Handler } from "webiny/api/website-builder/redirect";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/redirect-after-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-redirect-before-create` — intercept before redirect create
- `dependency-injection` — inject Logger, BuildParams, and other services
