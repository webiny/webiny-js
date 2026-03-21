---
name: api-group-after-update
category: api/cms
type: EventHandler
class: GroupAfterUpdateEventHandler
import: webiny/api/cms/group
description: >
  React after group is updated. Side effects, notifications, external sync.
---

# Group After Update

React after group is updated. Side effects, notifications, external sync.

**Import:** `import { GroupAfterUpdateEventHandler as Handler } from "webiny/api/cms/group";`
**Fires:** After group is updated
**Timing:** after

## Types

```typescript
import { GroupAfterUpdateEventHandler as Handler } from "webiny/api/cms/group";

// GroupAfterUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// GroupAfterUpdateEventHandler.Event
// Event payload:
export interface GroupAfterUpdateEventPayload {
    original: CmsGroup;
    group: CmsGroup;
}

// GroupAfterUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GroupAfterUpdateEventHandler as Handler } from "webiny/api/cms/group";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/group-after-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-group-before-update` — intercept before group update
- `dependency-injection` — inject Logger, BuildParams, and other services
