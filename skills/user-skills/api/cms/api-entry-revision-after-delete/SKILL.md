---
name: api-entry-revision-after-delete
category: api/cms
type: EventHandler
class: EntryRevisionAfterDeleteEventHandler
import: webiny/api/cms/entry
description: >
  React after entryrevision is deleted. Side effects, notifications, external sync.
---

# Entry Revision After Delete

React after entryrevision is deleted. Side effects, notifications, external sync.

**Import:** `import { EntryRevisionAfterDeleteEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** After entryrevision is deleted
**Timing:** after

## Types

```typescript
import { EntryRevisionAfterDeleteEventHandler as Handler } from "webiny/api/cms/entry";

// EntryRevisionAfterDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryRevisionAfterDeleteEventHandler.Event
// Event payload:
EntryRevisionAfterDeletePayload

// EntryRevisionAfterDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryRevisionAfterDeleteEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-revision-after-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-entry-revision-before-delete` — intercept before entryrevision delete
- `dependency-injection` — inject Logger, BuildParams, and other services
