---
name: api-group-after-create
category: api/cms
type: EventHandler
class: GroupAfterCreateEventHandler
import: webiny/api/cms/group
description: >
  React after group is created. Side effects, notifications, external sync.
---

# Group After Create

React after group is created. Side effects, notifications, external sync.

**Import:** `import { GroupAfterCreateEventHandler as Handler } from "webiny/api/cms/group";`
**Fires:** After group is created
**Timing:** after

## Types

```typescript
import { GroupAfterCreateEventHandler as Handler } from "webiny/api/cms/group";

// GroupAfterCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// GroupAfterCreateEventHandler.Event
// Event payload:
export interface GroupAfterCreateEventPayload {
    group: CmsGroup;
}

// GroupAfterCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GroupAfterCreateEventHandler as Handler } from "webiny/api/cms/group";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/group-after-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-group-before-create` — intercept before group create
- `dependency-injection` — inject Logger, BuildParams, and other services
