---
name: api-entry-before-restore-from-bin
category: api/cms
type: EventHandler
class: EntryBeforeRestoreFromBinEventHandler
import: webiny/api/cms/entry
description: >
  Intercept entry restore-from-bin before it is persisted. Validate, transform, or reject.
---

# Entry Before Restore-from-bin

Intercept entry restore-from-bin before it is persisted. Validate, transform, or reject.

**Import:** `import { EntryBeforeRestoreFromBinEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** Before entry is restored from bin
**Timing:** before

## Types

```typescript
import { EntryBeforeRestoreFromBinEventHandler as Handler } from "webiny/api/cms/entry";

// EntryBeforeRestoreFromBinEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryBeforeRestoreFromBinEventHandler.Event
// Event payload:
EntryBeforeRestoreFromBinEventPayload

// EntryBeforeRestoreFromBinEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryBeforeRestoreFromBinEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-before-restore-from-bin.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-entry-after-restore-from-bin` — react after entry restore-from-bin
- `dependency-injection` — inject Logger, BuildParams, and other services
