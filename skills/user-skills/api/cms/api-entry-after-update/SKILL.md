---
name: api-entry-after-update
category: api/cms
type: EventHandler
class: EntryAfterUpdateEventHandler
import: webiny/api/cms/entry
description: >
  React after entry is updated. Side effects, notifications, external sync.
---

# Entry After Update

React after entry is updated. Side effects, notifications, external sync.

**Import:** `import { EntryAfterUpdateEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** After entry is updated
**Timing:** after

## Types

```typescript
import { EntryAfterUpdateEventHandler as Handler } from "webiny/api/cms/entry";

// EntryAfterUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryAfterUpdateEventHandler.Event
// Event payload:
export interface EntryAfterUpdateEventPayload {
    entry: CmsEntry;
    original: CmsEntry;
    input: UpdateCmsEntryInput;
    model: CmsModel;
}

// EntryAfterUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryAfterUpdateEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-after-update.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-entry-before-update` — intercept before entry update
- `dependency-injection` — inject Logger, BuildParams, and other services
