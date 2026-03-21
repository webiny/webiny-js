---
name: api-page-after-delete
category: api/website-builder
type: EventHandler
class: PageAfterDeleteEventHandler
import: webiny/api/website-builder/page
description: >
  React after page is deleted. Side effects, notifications, external sync.
---

# Page After Delete

React after page is deleted. Side effects, notifications, external sync.

**Import:** `import { PageAfterDeleteEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** After page is deleted
**Timing:** after

## Types

```typescript
import { PageAfterDeleteEventHandler as Handler } from "webiny/api/website-builder/page";

// PageAfterDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageAfterDeleteEventHandler.Event
type Event = DomainEvent<PageAfterDeletePayload>;

// PageAfterDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageAfterDeleteEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-after-delete.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-page-before-delete` — intercept before page delete
- `dependency-injection` — inject Logger, BuildParams, and other services
