---
name: api-page-after-move
category: api/website-builder
type: EventHandler
class: PageAfterMoveEventHandler
import: webiny/api/website-builder/page
description: >
  React after page is moved. Side effects, notifications, external sync.
---

# Page After Move

React after page is moved. Side effects, notifications, external sync.

**Import:** `import { PageAfterMoveEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** After page is moved
**Timing:** after

## Types

```typescript
import { PageAfterMoveEventHandler as Handler } from "webiny/api/website-builder/page";

// PageAfterMoveEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageAfterMoveEventHandler.Event
type Event = DomainEvent<PageAfterMovePayload>;

// PageAfterMoveEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageAfterMoveEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-after-move.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-page-before-move` — intercept before page move
- `dependency-injection` — inject Logger, BuildParams, and other services
