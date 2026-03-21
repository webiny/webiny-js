---
name: api-entry-before-delete
category: api/cms
type: EventHandler
class: EntryBeforeDeleteEventHandler
import: webiny/api/cms/entry
description: >
  Intercept entry delete before it is persisted. Validate, transform, or reject.
---

# Entry Before Delete

Intercept entry delete before it is persisted. Validate, transform, or reject.

**Import:** `import { EntryBeforeDeleteEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** Before entry is deleted
**Timing:** before

## Types

```typescript
import { EntryBeforeDeleteEventHandler as Handler } from "webiny/api/cms/entry";

// EntryBeforeDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryBeforeDeleteEventHandler.Event
// Event payload:
EntryBeforeDeleteEventPayload

// EntryBeforeDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryBeforeDeleteEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-before-delete.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-entry-after-delete` — react after entry delete
- `dependency-injection` — inject Logger, BuildParams, and other services
