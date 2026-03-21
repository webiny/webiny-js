---
name: api-entry-revision-before-create
category: api/cms
type: EventHandler
class: EntryRevisionBeforeCreateEventHandler
import: webiny/api/cms/entry
description: >
  Intercept entryrevision create before it is persisted. Validate, transform, or reject.
---

# Entry Revision Before Create

Intercept entryrevision create before it is persisted. Validate, transform, or reject.

**Import:** `import { EntryRevisionBeforeCreateEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** Before entryrevision is created
**Timing:** before

## Types

```typescript
import { EntryRevisionBeforeCreateEventHandler as Handler } from "webiny/api/cms/entry";

// EntryRevisionBeforeCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryRevisionBeforeCreateEventHandler.Event
// Event payload:
EntryRevisionBeforeCreateEventPayload

// EntryRevisionBeforeCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryRevisionBeforeCreateEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-revision-before-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-entry-revision-after-create` — react after entryrevision create
- `dependency-injection` — inject Logger, BuildParams, and other services
