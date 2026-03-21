---
name: api-entry-before-unpublish
category: api/cms
type: EventHandler
class: EntryBeforeUnpublishEventHandler
import: webiny/api/cms/entry
description: >
  Intercept entry unpublish before it is persisted. Validate, transform, or reject.
---

# Entry Before Unpublish

Intercept entry unpublish before it is persisted. Validate, transform, or reject.

**Import:** `import { EntryBeforeUnpublishEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** Before entry is unpublished
**Timing:** before

## Types

```typescript
import { EntryBeforeUnpublishEventHandler as Handler } from "webiny/api/cms/entry";

// EntryBeforeUnpublishEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryBeforeUnpublishEventHandler.Event
// Event payload:
export interface EntryBeforeUnpublishEventPayload {
    entry: CmsEntry;
    model: CmsModel;
}

// EntryBeforeUnpublishEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryBeforeUnpublishEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-before-unpublish.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-entry-after-unpublish` — react after entry unpublish
- `dependency-injection` — inject Logger, BuildParams, and other services
