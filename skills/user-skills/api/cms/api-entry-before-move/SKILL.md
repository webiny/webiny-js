---
name: api-entry-before-move
category: api/cms
type: EventHandler
class: EntryBeforeMoveEventHandler
import: webiny/api/cms/entry
description: >
  Intercept entry move before it is persisted. Validate, transform, or reject.
---

# Entry Before Move

Intercept entry move before it is persisted. Validate, transform, or reject.

**Import:** `import { EntryBeforeMoveEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** Before entry is moved
**Timing:** before

## Types

```typescript
import { EntryBeforeMoveEventHandler as Handler } from "webiny/api/cms/entry";

// EntryBeforeMoveEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryBeforeMoveEventHandler.Event
// Event payload:
EntryBeforeMoveEventPayload

// EntryBeforeMoveEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryBeforeMoveEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-before-move.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-entry-after-move` — react after entry move
- `dependency-injection` — inject Logger, BuildParams, and other services
