---
name: api-page-after-unpublish
category: api/website-builder
type: EventHandler
class: PageAfterUnpublishEventHandler
import: webiny/api/website-builder/page
description: >
  React after page is unpublished. Side effects, notifications, external sync.
---

# Page After Unpublish

React after page is unpublished. Side effects, notifications, external sync.

**Import:** `import { PageAfterUnpublishEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** After page is unpublished
**Timing:** after

## Types

```typescript
import { PageAfterUnpublishEventHandler as Handler } from "webiny/api/website-builder/page";

// PageAfterUnpublishEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageAfterUnpublishEventHandler.Event
type Event = DomainEvent<PageAfterUnpublishPayload>;

// PageAfterUnpublishEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageAfterUnpublishEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-after-unpublish.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-page-before-unpublish` — intercept before page unpublish
- `dependency-injection` — inject Logger, BuildParams, and other services
