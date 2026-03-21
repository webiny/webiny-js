---
name: api-page-after-publish
category: api/website-builder
type: EventHandler
class: PageAfterPublishEventHandler
import: webiny/api/website-builder/page
description: >
  React after page is published. Side effects, notifications, external sync.
---

# Page After Publish

React after page is published. Side effects, notifications, external sync.

**Import:** `import { PageAfterPublishEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** After page is published
**Timing:** after

## Types

```typescript
import { PageAfterPublishEventHandler as Handler } from "webiny/api/website-builder/page";

// PageAfterPublishEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageAfterPublishEventHandler.Event
type Event = DomainEvent<PageAfterPublishPayload>;

// PageAfterPublishEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageAfterPublishEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-after-publish.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-page-before-publish` — intercept before page publish
- `dependency-injection` — inject Logger, BuildParams, and other services
