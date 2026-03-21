---
name: api-entry-before-delete-multiple
category: api/cms
type: EventHandler
class: EntryBeforeDeleteMultipleEventHandler
import: webiny/api/cms/entry
description: >
  Intercept entry delete-multiple before it is persisted. Validate, transform, or reject.
---

# Entry Before Delete-multiple

Intercept entry delete-multiple before it is persisted. Validate, transform, or reject.

**Import:** `import { EntryBeforeDeleteMultipleEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** Before entry is deleted (batch)
**Timing:** before

## Types

```typescript
import { EntryBeforeDeleteMultipleEventHandler as Handler } from "webiny/api/cms/entry";

// EntryBeforeDeleteMultipleEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryBeforeDeleteMultipleEventHandler.Event
// Event payload:
EntryBeforeDeleteMultipleEventPayload

// EntryBeforeDeleteMultipleEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryBeforeDeleteMultipleEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-before-delete-multiple.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-entry-after-delete-multiple` — react after entry delete-multiple
- `dependency-injection` — inject Logger, BuildParams, and other services
