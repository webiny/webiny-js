---
name: api-group-before-create
category: api/cms
type: EventHandler
class: GroupBeforeCreateEventHandler
import: webiny/api/cms/group
description: >
  Intercept group create before it is persisted. Validate, transform, or reject.
---

# Group Before Create

Intercept group create before it is persisted. Validate, transform, or reject.

**Import:** `import { GroupBeforeCreateEventHandler as Handler } from "webiny/api/cms/group";`
**Fires:** Before group is created
**Timing:** before

## Types

```typescript
import { GroupBeforeCreateEventHandler as Handler } from "webiny/api/cms/group";

// GroupBeforeCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// GroupBeforeCreateEventHandler.Event
// Event payload:
export interface GroupBeforeCreateEventPayload {
    group: CmsGroup;
}

// GroupBeforeCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GroupBeforeCreateEventHandler as Handler } from "webiny/api/cms/group";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/group-before-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-group-after-create` — react after group create
- `dependency-injection` — inject Logger, BuildParams, and other services
