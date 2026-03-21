---
name: api-group-after-delete
category: api/cms
type: EventHandler
class: GroupAfterDeleteEventHandler
import: webiny/api/cms/group
description: >
  React after group is deleted. Side effects, notifications, external sync.
---

# Group After Delete

React after group is deleted. Side effects, notifications, external sync.

**Import:** `import { GroupAfterDeleteEventHandler as Handler } from "webiny/api/cms/group";`
**Fires:** After group is deleted
**Timing:** after

## Types

```typescript
import { GroupAfterDeleteEventHandler as Handler } from "webiny/api/cms/group";

// GroupAfterDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// GroupAfterDeleteEventHandler.Event
// Event payload:
export interface GroupAfterDeleteEventPayload {
    group: CmsGroup;
}

// GroupAfterDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GroupAfterDeleteEventHandler as Handler } from "webiny/api/cms/group";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/group-after-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-group-before-delete` — intercept before group delete
- `dependency-injection` — inject Logger, BuildParams, and other services
