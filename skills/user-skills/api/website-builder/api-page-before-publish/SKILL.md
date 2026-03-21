---
name: api-page-before-publish
category: api/website-builder
type: EventHandler
class: PageBeforePublishEventHandler
import: webiny/api/website-builder/page
description: >
  Intercept page publish before it is persisted. Validate, transform, or reject.
---

# Page Before Publish

Intercept page publish before it is persisted. Validate, transform, or reject.

**Import:** `import { PageBeforePublishEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** Before page is published
**Timing:** before

## Types

```typescript
import { PageBeforePublishEventHandler as Handler } from "webiny/api/website-builder/page";

// PageBeforePublishEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageBeforePublishEventHandler.Event
type Event = DomainEvent<PageBeforePublishPayload>;

// PageBeforePublishEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageBeforePublishEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-before-publish.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-page-after-publish` — react after page publish
- `dependency-injection` — inject Logger, BuildParams, and other services
