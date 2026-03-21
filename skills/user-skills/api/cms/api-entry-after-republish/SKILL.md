---
name: api-entry-after-republish
category: api/cms
type: EventHandler
class: EntryAfterRepublishEventHandler
import: webiny/api/cms/entry
description: >
  React after entry is republished. Side effects, notifications, external sync.
---

# Entry After Republish

React after entry is republished. Side effects, notifications, external sync.

**Import:** `import { EntryAfterRepublishEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** After entry is republished
**Timing:** after

## Types

```typescript
import { EntryAfterRepublishEventHandler as Handler } from "webiny/api/cms/entry";

// EntryAfterRepublishEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryAfterRepublishEventHandler.Event
// Event payload:
EntryAfterRepublishEventPayload

// EntryAfterRepublishEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryAfterRepublishEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-after-republish.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-entry-before-republish` — intercept before entry republish
- `dependency-injection` — inject Logger, BuildParams, and other services
