---
name: api-page-after-create-revision-from
category: api/website-builder
type: EventHandler
class: PageAfterCreateRevisionFromEventHandler
import: webiny/api/website-builder/page
description: >
  React after page is created (revision from existing). Side effects, notifications, external sync.
---

# Page After Create-revision-from

React after page is created (revision from existing). Side effects, notifications, external sync.

**Import:** `import { PageAfterCreateRevisionFromEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** After page is created (revision from existing)
**Timing:** after

## Types

```typescript
import { PageAfterCreateRevisionFromEventHandler as Handler } from "webiny/api/website-builder/page";

// PageAfterCreateRevisionFromEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageAfterCreateRevisionFromEventHandler.Event
type Event = DomainEvent<PageAfterCreateRevisionFromPayload>;

// PageAfterCreateRevisionFromEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageAfterCreateRevisionFromEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-after-create-revision-from.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-page-before-create-revision-from` — intercept before page create-revision-from
- `dependency-injection` — inject Logger, BuildParams, and other services
