---
name: api-entry-after-publish
category: api/cms
type: EventHandler
class: EntryAfterPublishEventHandler
import: webiny/api/cms/entry
description: >
  React after entry is published. Side effects, notifications, external sync.
---

# Entry After Publish

React after entry is published. Side effects, notifications, external sync.

**Import:** `import { EntryAfterPublishEventHandler as Handler } from "webiny/api/cms/entry";`
**Fires:** After entry is published
**Timing:** after

## Types

```typescript
import { EntryAfterPublishEventHandler as Handler } from "webiny/api/cms/entry";

// EntryAfterPublishEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// EntryAfterPublishEventHandler.Event
// Event payload:
EntryAfterPublishEventPayload

// EntryAfterPublishEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { EntryAfterPublishEventHandler as Handler } from "webiny/api/cms/entry";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/entry-after-publish.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-entry-before-publish` — intercept before entry publish
- `dependency-injection` — inject Logger, BuildParams, and other services
