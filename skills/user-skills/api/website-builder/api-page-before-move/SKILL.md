---
name: api-page-before-move
category: api/website-builder
type: EventHandler
class: PageBeforeMoveEventHandler
import: webiny/api/website-builder/page
description: >
  Intercept page move before it is persisted. Validate, transform, or reject.
---

# Page Before Move

Intercept page move before it is persisted. Validate, transform, or reject.

**Import:** `import { PageBeforeMoveEventHandler as Handler } from "webiny/api/website-builder/page";`
**Fires:** Before page is moved
**Timing:** before

## Types

```typescript
import { PageBeforeMoveEventHandler as Handler } from "webiny/api/website-builder/page";

// PageBeforeMoveEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// PageBeforeMoveEventHandler.Event
type Event = DomainEvent<PageBeforeMovePayload>;

// PageBeforeMoveEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { PageBeforeMoveEventHandler as Handler } from "webiny/api/website-builder/page";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/page-before-move.ts"} />
```

## Notes

- Page handlers affect all pages across all locales
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-page-after-move` — react after page move
- `dependency-injection` — inject Logger, BuildParams, and other services
