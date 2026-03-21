---
name: api-page-after-duplicate
category: api/website-builder
type: EventHandler
class: PageAfterDuplicateEventHandler
import: webiny/api/website-builder/page
description: >
  React after page is duplicated. Side effects, notifications, external sync.
---

# Page After Duplicate

React after page is duplicated. Side effects, notifications, external sync.

**Import:** `import { PageAfterDuplicateEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** After page is duplicated
**Timing:** after

## Types

```typescript
import { PageAfterDuplicateEventHandler as Handler } from "webiny/api/website-builder/page";

// PageAfterDuplicateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageAfterDuplicateEventHandler.Event
type Event = DomainEvent<PageAfterDuplicatePayload>;

// PageAfterDuplicateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageAfterDuplicateEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-after-duplicate.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-page-before-duplicate` — intercept before page duplicate
- `dependency-injection` — inject Logger, BuildParams, and other services
