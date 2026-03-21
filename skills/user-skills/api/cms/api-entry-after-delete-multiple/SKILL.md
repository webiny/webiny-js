---
name: api-entry-after-delete-multiple
category: api/cms
type: EventHandler
class: EntryAfterDeleteMultipleEventHandler
import: webiny/api/cms/entry
description: >
  React after entry is deleted (batch). Side effects, notifications, external sync.
---

# Entry After Delete-multiple

React after entry is deleted (batch). Side effects, notifications, external sync.

**Import:** `import { EntryAfterDeleteMultipleEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** After entry is deleted (batch)
**Timing:** after

## Types

```typescript
import { EntryAfterDeleteMultipleEventHandler as Handler } from "webiny/api/cms/entry";

// EntryAfterDeleteMultipleEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryAfterDeleteMultipleEventHandler.Event
// Event payload:
EntryAfterDeleteMultipleEventPayload

// EntryAfterDeleteMultipleEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryAfterDeleteMultipleEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-after-delete-multiple.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-entry-before-delete-multiple` — intercept before entry delete-multiple
- `dependency-injection` — inject Logger, BuildParams, and other services
