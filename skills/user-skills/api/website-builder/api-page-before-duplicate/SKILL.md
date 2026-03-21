---
name: api-page-before-duplicate
category: api/website-builder
type: EventHandler
class: PageBeforeDuplicateEventHandler
import: webiny/api/website-builder/page
description: >
  Intercept page duplicate before it is persisted. Validate, transform, or reject.
---

# Page Before Duplicate

Intercept page duplicate before it is persisted. Validate, transform, or reject.

**Import:** `import { PageBeforeDuplicateEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** Before page is duplicated
**Timing:** before

## Types

```typescript
import { PageBeforeDuplicateEventHandler as Handler } from "webiny/api/website-builder/page";

// PageBeforeDuplicateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageBeforeDuplicateEventHandler.Event
type Event = DomainEvent<PageBeforeDuplicatePayload>;

// PageBeforeDuplicateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageBeforeDuplicateEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-before-duplicate.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-page-after-duplicate` — react after page duplicate
- `dependency-injection` — inject Logger, BuildParams, and other services
