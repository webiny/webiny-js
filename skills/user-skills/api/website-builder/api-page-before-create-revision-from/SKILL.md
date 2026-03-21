---
name: api-page-before-create-revision-from
category: api/website-builder
type: EventHandler
class: PageBeforeCreateRevisionFromEventHandler
import: webiny/api/website-builder/page
description: >
  Intercept page create-revision-from before it is persisted. Validate, transform, or reject.
---

# Page Before Create-revision-from

Intercept page create-revision-from before it is persisted. Validate, transform, or reject.

**Import:** `import { PageBeforeCreateRevisionFromEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** Before page is created (revision from existing)
**Timing:** before

## Types

```typescript
import { PageBeforeCreateRevisionFromEventHandler as Handler } from "webiny/api/website-builder/page";

// PageBeforeCreateRevisionFromEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageBeforeCreateRevisionFromEventHandler.Event
type Event = DomainEvent<PageBeforeCreateRevisionFromPayload>;

// PageBeforeCreateRevisionFromEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageBeforeCreateRevisionFromEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-before-create-revision-from.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-page-after-create-revision-from` — react after page create-revision-from
- `dependency-injection` — inject Logger, BuildParams, and other services
