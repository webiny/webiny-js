---
name: api-entry-before-update
category: api/cms
type: EventHandler
class: EntryBeforeUpdateEventHandler
import: webiny/api/cms/entry
description: >
  Intercept entry update before it is persisted. Validate, transform, or reject.
---

# Entry Before Update

Intercept entry update before it is persisted. Validate, transform, or reject.

**Import:** `import { EntryBeforeUpdateEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** Before entry is updated
**Timing:** before

## Types

```typescript
import { EntryBeforeUpdateEventHandler as Handler } from "webiny/api/cms/entry";

// EntryBeforeUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryBeforeUpdateEventHandler.Event
// Event payload:
export interface EntryBeforeUpdateEventPayload {
    entry: CmsEntry;
    original: CmsEntry;
    input: UpdateCmsEntryInput;
    model: CmsModel;
}

// EntryBeforeUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryBeforeUpdateEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-before-update.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-entry-after-update` — react after entry update
- `dependency-injection` — inject Logger, BuildParams, and other services
