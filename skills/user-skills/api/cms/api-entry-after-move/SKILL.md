---
name: api-entry-after-move
category: api/cms
type: EventHandler
class: EntryAfterMoveEventHandler
import: webiny/api/cms/entry
description: >
  React after entry is moved. Side effects, notifications, external sync.
---

# Entry After Move

React after entry is moved. Side effects, notifications, external sync.

**Import:** `import { EntryAfterMoveEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** After entry is moved
**Timing:** after

## Types

```typescript
import { EntryAfterMoveEventHandler as Handler } from "webiny/api/cms/entry";

// EntryAfterMoveEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryAfterMoveEventHandler.Event
// Event payload:
EntryAfterMoveEventPayload

// EntryAfterMoveEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryAfterMoveEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-after-move.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-entry-before-move` — intercept before entry move
- `dependency-injection` — inject Logger, BuildParams, and other services
