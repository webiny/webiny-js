---
name: api-page-after-update
category: api/website-builder
type: EventHandler
class: PageAfterUpdateEventHandler
import: webiny/api/website-builder/page
description: >
  React after page is updated. Side effects, notifications, external sync.
---

# Page After Update

React after page is updated. Side effects, notifications, external sync.

**Import:** `import { PageAfterUpdateEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** After page is updated
**Timing:** after

## Types

```typescript
import { PageAfterUpdateEventHandler as Handler } from "webiny/api/website-builder/page";

// PageAfterUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageAfterUpdateEventHandler.Event
type Event = DomainEvent<PageAfterUpdatePayload>;

// PageAfterUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageAfterUpdateEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-after-update.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-page-before-update` — intercept before page update
- `dependency-injection` — inject Logger, BuildParams, and other services
