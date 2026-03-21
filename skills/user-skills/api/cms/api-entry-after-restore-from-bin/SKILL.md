---
name: api-entry-after-restore-from-bin
category: api/cms
type: EventHandler
class: EntryAfterRestoreFromBinEventHandler
import: webiny/api/cms/entry
description: >
  React after entry is restored from bin. Side effects, notifications, external sync.
---

# Entry After Restore-from-bin

React after entry is restored from bin. Side effects, notifications, external sync.

**Import:** `import { EntryAfterRestoreFromBinEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** After entry is restored from bin
**Timing:** after

## Types

```typescript
import { EntryAfterRestoreFromBinEventHandler as Handler } from "webiny/api/cms/entry";

// EntryAfterRestoreFromBinEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryAfterRestoreFromBinEventHandler.Event
// Event payload:
EntryAfterRestoreFromBinEventPayload

// EntryAfterRestoreFromBinEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryAfterRestoreFromBinEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-after-restore-from-bin.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-entry-before-restore-from-bin` — intercept before entry restore-from-bin
- `dependency-injection` — inject Logger, BuildParams, and other services
