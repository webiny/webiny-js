---
name: api-entry-after-unpublish
category: api/cms
type: EventHandler
class: EntryAfterUnpublishEventHandler
import: webiny/api/cms/entry
description: >
  React after entry is unpublished. Side effects, notifications, external sync.
---

# Entry After Unpublish

React after entry is unpublished. Side effects, notifications, external sync.

**Import:** `import { EntryAfterUnpublishEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** After entry is unpublished
**Timing:** after

## Types

```typescript
import { EntryAfterUnpublishEventHandler as Handler } from "webiny/api/cms/entry";

// EntryAfterUnpublishEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryAfterUnpublishEventHandler.Event
// Event payload:
export interface EntryAfterUnpublishEventPayload {
    entry: CmsEntry;
    storageEntry: any;
    model: CmsModel;
}

// EntryAfterUnpublishEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryAfterUnpublishEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-after-unpublish.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-entry-before-unpublish` — intercept before entry unpublish
- `dependency-injection` — inject Logger, BuildParams, and other services
