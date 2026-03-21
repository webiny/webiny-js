---
name: api-group-before-update
category: api/cms
type: EventHandler
class: GroupBeforeUpdateEventHandler
import: webiny/api/cms/group
description: >
  Intercept group update before it is persisted. Validate, transform, or reject.
---

# Group Before Update

Intercept group update before it is persisted. Validate, transform, or reject.

**Import:** `import { GroupBeforeUpdateEventHandler as Handler } from "webiny/api/cms/group";`
**Fires:** Before group is updated
**Timing:** before

## Types

```typescript
import { GroupBeforeUpdateEventHandler as Handler } from "webiny/api/cms/group";

// GroupBeforeUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// GroupBeforeUpdateEventHandler.Event
// Event payload:
export interface GroupBeforeUpdateEventPayload {
    original: CmsGroup;
    group: CmsGroup;
}

// GroupBeforeUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GroupBeforeUpdateEventHandler as Handler } from "webiny/api/cms/group";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/group-before-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-group-after-update` — react after group update
- `dependency-injection` — inject Logger, BuildParams, and other services
