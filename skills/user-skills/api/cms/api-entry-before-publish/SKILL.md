---
name: api-entry-before-publish
category: api/cms
type: EventHandler
class: EntryBeforePublishEventHandler
import: webiny/api/cms/entry
description: >
  Intercept entry publish before it is persisted. Validate, transform, or reject.
---

# Entry Before Publish

Intercept entry publish before it is persisted. Validate, transform, or reject.

**Import:** `import { EntryBeforePublishEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** Before entry is published
**Timing:** before

## Types

```typescript
import { EntryBeforePublishEventHandler as Handler } from "webiny/api/cms/entry";

// EntryBeforePublishEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryBeforePublishEventHandler.Event
// Event payload:
EntryBeforePublishEventPayload

// EntryBeforePublishEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryBeforePublishEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-before-publish.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-entry-after-publish` — react after entry publish
- `dependency-injection` — inject Logger, BuildParams, and other services
