---
name: api-entry-revision-before-delete
category: api/cms
type: EventHandler
class: EntryRevisionBeforeDeleteEventHandler
import: webiny/api/cms/entry
description: >
  Intercept entryrevision delete before it is persisted. Validate, transform, or reject.
---

# Entry Revision Before Delete

Intercept entryrevision delete before it is persisted. Validate, transform, or reject.

**Import:** `import { EntryRevisionBeforeDeleteEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** Before entryrevision is deleted
**Timing:** before

## Types

```typescript
import { EntryRevisionBeforeDeleteEventHandler as Handler } from "webiny/api/cms/entry";

// EntryRevisionBeforeDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryRevisionBeforeDeleteEventHandler.Event
// Event payload:
EntryRevisionBeforeDeletePayload

// EntryRevisionBeforeDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryRevisionBeforeDeleteEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-revision-before-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-entry-revision-after-delete` — react after entryrevision delete
- `dependency-injection` — inject Logger, BuildParams, and other services
