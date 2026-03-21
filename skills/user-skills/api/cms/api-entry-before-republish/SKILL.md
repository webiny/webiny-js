---
name: api-entry-before-republish
category: api/cms
type: EventHandler
class: EntryBeforeRepublishEventHandler
import: webiny/api/cms/entry
description: >
  Intercept entry republish before it is persisted. Validate, transform, or reject.
---

# Entry Before Republish

Intercept entry republish before it is persisted. Validate, transform, or reject.

**Import:** `import { EntryBeforeRepublishEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** Before entry is republished
**Timing:** before

## Types

```typescript
import { EntryBeforeRepublishEventHandler as Handler } from "webiny/api/cms/entry";

// EntryBeforeRepublishEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryBeforeRepublishEventHandler.Event
// Event payload:
EntryBeforeRepublishEventPayload

// EntryBeforeRepublishEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryBeforeRepublishEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-before-republish.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-entry-after-republish` — react after entry republish
- `dependency-injection` — inject Logger, BuildParams, and other services
