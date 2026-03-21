---
name: api-entry-after-delete
category: api/cms
type: EventHandler
class: EntryAfterDeleteEventHandler
import: webiny/api/cms/entry
description: >
  React after entry is deleted. Side effects, notifications, external sync.
---

# Entry After Delete

React after entry is deleted. Side effects, notifications, external sync.

**Import:** `import { EntryAfterDeleteEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** After entry is deleted
**Timing:** after

## Types

```typescript
import { EntryAfterDeleteEventHandler as Handler } from "webiny/api/cms/entry";

// EntryAfterDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryAfterDeleteEventHandler.Event
// Event payload:
EntryAfterDeleteEventPayload

// EntryAfterDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryAfterDeleteEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-after-delete.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-entry-before-delete` — intercept before entry delete
- `dependency-injection` — inject Logger, BuildParams, and other services
