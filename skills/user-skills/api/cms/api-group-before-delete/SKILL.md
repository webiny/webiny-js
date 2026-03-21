---
name: api-group-before-delete
category: api/cms
type: EventHandler
class: GroupBeforeDeleteEventHandler
import: webiny/api/cms/group
description: >
  Intercept group delete before it is persisted. Validate, transform, or reject.
---

# Group Before Delete

Intercept group delete before it is persisted. Validate, transform, or reject.

**Import:** `import { GroupBeforeDeleteEventHandler as Handler } from "webiny/api/cms/group";`
**Fires:** Before group is deleted
**Timing:** before

## Types

```typescript
import { GroupBeforeDeleteEventHandler as Handler } from "webiny/api/cms/group";

// GroupBeforeDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// GroupBeforeDeleteEventHandler.Event
// Event payload:
export interface GroupBeforeDeleteEventPayload {
    group: CmsGroup;
}

// GroupBeforeDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GroupBeforeDeleteEventHandler as Handler } from "webiny/api/cms/group";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/group-before-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-group-after-delete` — react after group delete
- `dependency-injection` — inject Logger, BuildParams, and other services
