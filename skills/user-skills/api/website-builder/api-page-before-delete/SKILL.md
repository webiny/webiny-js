---
name: api-page-before-delete
category: api/website-builder
type: EventHandler
class: PageBeforeDeleteEventHandler
import: webiny/api/website-builder/page
description: >
  Intercept page delete before it is persisted. Validate, transform, or reject.
---

# Page Before Delete

Intercept page delete before it is persisted. Validate, transform, or reject.

**Import:** `import { PageBeforeDeleteEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** Before page is deleted
**Timing:** before

## Types

```typescript
import { PageBeforeDeleteEventHandler as Handler } from "webiny/api/website-builder/page";

// PageBeforeDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageBeforeDeleteEventHandler.Event
type Event = DomainEvent<PageBeforeDeletePayload>;

// PageBeforeDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageBeforeDeleteEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-before-delete.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-page-after-delete` — react after page delete
- `dependency-injection` — inject Logger, BuildParams, and other services
