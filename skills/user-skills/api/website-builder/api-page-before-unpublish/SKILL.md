---
name: api-page-before-unpublish
category: api/website-builder
type: EventHandler
class: PageBeforeUnpublishEventHandler
import: webiny/api/website-builder/page
description: >
  Intercept page unpublish before it is persisted. Validate, transform, or reject.
---

# Page Before Unpublish

Intercept page unpublish before it is persisted. Validate, transform, or reject.

**Import:** `import { PageBeforeUnpublishEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** Before page is unpublished
**Timing:** before

## Types

```typescript
import { PageBeforeUnpublishEventHandler as Handler } from "webiny/api/website-builder/page";

// PageBeforeUnpublishEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageBeforeUnpublishEventHandler.Event
type Event = DomainEvent<PageBeforeUnpublishPayload>;

// PageBeforeUnpublishEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageBeforeUnpublishEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-before-unpublish.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-page-after-unpublish` — react after page unpublish
- `dependency-injection` — inject Logger, BuildParams, and other services
