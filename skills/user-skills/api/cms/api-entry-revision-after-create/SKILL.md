---
name: api-entry-revision-after-create
category: api/cms
type: EventHandler
class: EntryRevisionAfterCreateEventHandler
import: webiny/api/cms/entry
description: >
  React after entryrevision is created. Side effects, notifications, external sync.
---

# Entry Revision After Create

React after entryrevision is created. Side effects, notifications, external sync.

**Import:** `import { EntryRevisionAfterCreateEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** After entryrevision is created
**Timing:** after

## Types

```typescript
import { EntryRevisionAfterCreateEventHandler as Handler } from "webiny/api/cms/entry";

// EntryRevisionAfterCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryRevisionAfterCreateEventHandler.Event
// Event payload:
EntryRevisionAfterCreateEventPayload

// EntryRevisionAfterCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryRevisionAfterCreateEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-revision-after-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-entry-revision-before-create` — intercept before entryrevision create
- `dependency-injection` — inject Logger, BuildParams, and other services
