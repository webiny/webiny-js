---
name: api-folder-before-delete
category: api/aco
type: EventHandler
class: FolderBeforeDeleteEventHandler
import: webiny/api/aco/folder
description: >
  Intercept folder delete before it is persisted. Validate, transform, or reject.
---

# Folder Before Delete

Intercept folder delete before it is persisted. Validate, transform, or reject.

**Import:** `import { FolderBeforeDeleteEventHandler as Handler } from "webiny/api/aco/folder";`
**Fires:** Before folder is deleted
**Timing:** before

## Types

```typescript
import { FolderBeforeDeleteEventHandler as Handler } from "webiny/api/aco/folder";

// FolderBeforeDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FolderBeforeDeleteEventHandler.Event
type Event = DomainEvent<FolderBeforeDeletePayload>;

// FolderBeforeDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FolderBeforeDeleteEventHandler as Handler } from "webiny/api/aco/folder";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/folder-before-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-folder-after-delete` — react after folder delete
- `dependency-injection` — inject Logger, BuildParams, and other services
