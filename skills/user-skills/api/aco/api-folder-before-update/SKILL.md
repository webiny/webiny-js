---
name: api-folder-before-update
category: api/aco
type: EventHandler
class: FolderBeforeUpdateEventHandler
import: webiny/api/aco/folder
description: >
  Intercept folder update before it is persisted. Validate, transform, or reject.
---

# Folder Before Update

Intercept folder update before it is persisted. Validate, transform, or reject.

**Import:** `import { FolderBeforeUpdateEventHandler as Handler } from "webiny/api/aco/folder";`
**Fires:** Before folder is updated
**Timing:** before

## Types

```typescript
import { FolderBeforeUpdateEventHandler as Handler } from "webiny/api/aco/folder";

// FolderBeforeUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FolderBeforeUpdateEventHandler.Event
type Event = DomainEvent<FolderBeforeUpdatePayload>;

// FolderBeforeUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FolderBeforeUpdateEventHandler as Handler } from "webiny/api/aco/folder";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/folder-before-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-folder-after-update` — react after folder update
- `dependency-injection` — inject Logger, BuildParams, and other services
