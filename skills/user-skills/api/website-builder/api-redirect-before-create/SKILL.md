---
name: api-redirect-before-create
category: api/website-builder
type: EventHandler
class: RedirectBeforeCreateEventHandler
import: webiny/api/website-builder/redirect
description: >
  Intercept redirect create before it is persisted. Validate, transform, or reject.
---

# Redirect Before Create

Intercept redirect create before it is persisted. Validate, transform, or reject.

**Import:** `import { RedirectBeforeCreateEventHandler as Handler } from "webiny/api/website-builder/redirect";`
**Fires:** Before redirect is created
**Timing:** before

## Types

```typescript
import { RedirectBeforeCreateEventHandler as Handler } from "webiny/api/website-builder/redirect";

// RedirectBeforeCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// RedirectBeforeCreateEventHandler.Event
type Event = DomainEvent<RedirectBeforeCreatePayload>;

// RedirectBeforeCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { RedirectBeforeCreateEventHandler as Handler } from "webiny/api/website-builder/redirect";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/redirect-before-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-redirect-after-create` — react after redirect create
- `dependency-injection` — inject Logger, BuildParams, and other services
