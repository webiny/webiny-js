---
name: api-page-before-update
category: api/website-builder
type: EventHandler
class: PageBeforeUpdateEventHandler
import: webiny/api/website-builder/page
description: >
  Intercept page update before it is persisted. Validate, transform, or reject.
---

# Page Before Update

Intercept page update before it is persisted. Validate, transform, or reject.

**Import:** `import { PageBeforeUpdateEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** Before page is updated
**Timing:** before

## Types

```typescript
import { PageBeforeUpdateEventHandler as Handler } from "webiny/api/website-builder/page";

// PageBeforeUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageBeforeUpdateEventHandler.Event
type Event = DomainEvent<PageBeforeUpdatePayload>;

// PageBeforeUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageBeforeUpdateEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-before-update.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-page-after-update` — react after page update
- `dependency-injection` — inject Logger, BuildParams, and other services
