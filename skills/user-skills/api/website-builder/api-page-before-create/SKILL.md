---
name: api-page-before-create
category: api/website-builder
type: EventHandler
class: PageBeforeCreateEventHandler
import: webiny/api/website-builder/page
description: >
  Intercept page create before it is persisted. Validate, transform, or reject.
---

# Page Before Create

Intercept page create before it is persisted. Validate, transform, or reject.

**Import:** `import { PageBeforeCreateEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** Before page is created
**Timing:** before

## Types

```typescript
import { PageBeforeCreateEventHandler as Handler } from "webiny/api/website-builder/page";

// PageBeforeCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageBeforeCreateEventHandler.Event
type Event = DomainEvent<PageBeforeCreatePayload>;

// PageBeforeCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageBeforeCreateEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-before-create.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-page-after-create` — react after page create
- `dependency-injection` — inject Logger, BuildParams, and other services
