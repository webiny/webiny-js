---
name: api-page-after-create
category: api/website-builder
type: EventHandler
class: PageAfterCreateEventHandler
import: webiny/api/website-builder/page
description: >
  React after page is created. Side effects, notifications, external sync.
---

# Page After Create

React after page is created. Side effects, notifications, external sync.

**Import:** `import { PageAfterCreateEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** After page is created
**Timing:** after

## Types

```typescript
import { PageAfterCreateEventHandler as Handler } from "webiny/api/website-builder/page";

// PageAfterCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageAfterCreateEventHandler.Event
type Event = DomainEvent<PageAfterCreatePayload>;

// PageAfterCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageAfterCreateEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-after-create.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-page-before-create` — intercept before page create
- `dependency-injection` — inject Logger, BuildParams, and other services
