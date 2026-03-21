---
name: api-entry-after-create
category: api/cms
type: EventHandler
class: EntryAfterCreateEventHandler
import: webiny/api/cms/entry
description: >
  React after entry is created. Side effects, notifications, external sync.
---

# Entry After Create

React after entry is created. Side effects, notifications, external sync.

**Import:** `import { EntryAfterCreateEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** After entry is created
**Timing:** after

## Types

```typescript
import { EntryAfterCreateEventHandler as Handler } from "webiny/api/cms/entry";

// EntryAfterCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryAfterCreateEventHandler.Event
// Event payload:
export interface EntryAfterCreateEventPayload {
    entry: CmsEntry;
    input: CreateCmsEntryInput;
    model: CmsModel;
}

// EntryAfterCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryAfterCreateEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-after-create.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-entry-before-create` — intercept before entry create
- `dependency-injection` — inject Logger, BuildParams, and other services
