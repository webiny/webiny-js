---
name: api-entry-before-create
category: api/cms
type: EventHandler
class: EntryBeforeCreateEventHandler
import: webiny/api/cms/entry
description: >
  Intercept entry create before it is persisted. Validate, transform, or reject.
---

# Entry Before Create

Intercept entry create before it is persisted. Validate, transform, or reject.

**Import:** `import { EntryBeforeCreateEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** Before entry is created
**Timing:** before

## Types

```typescript
import { EntryBeforeCreateEventHandler as Handler } from "webiny/api/cms/entry";

// EntryBeforeCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryBeforeCreateEventHandler.Event
// Event payload:
export interface EntryBeforeCreateEventPayload {
    entry: CmsEntry;
    input: CreateCmsEntryInput;
    model: CmsModel;
}

// EntryBeforeCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryBeforeCreateEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-before-create.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-entry-after-create` — react after entry create
- `dependency-injection` — inject Logger, BuildParams, and other services
