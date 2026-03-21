---
name: api-folder-after-delete
category: api/aco
type: EventHandler
class: FolderAfterDeleteEventHandler
import: webiny/api/aco/folder
description: >
  React after folder is deleted. Side effects, notifications, external sync.
---

# Folder After Delete

React after folder is deleted. Side effects, notifications, external sync.

**Import:** `import { FolderAfterDeleteEventHandler as Handler } from "webiny/api/aco/folder";`
**Fires:** After folder is deleted
**Timing:** after

## Types

```typescript
import { FolderAfterDeleteEventHandler as Handler } from "webiny/api/aco/folder";

// FolderAfterDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FolderAfterDeleteEventHandler.Event
type Event = DomainEvent<FolderAfterDeletePayload>;

// FolderAfterDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FolderAfterDeleteEventHandler as Handler } from "webiny/api/aco/folder";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/folder-after-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-folder-before-delete` — intercept before folder delete
- `dependency-injection` — inject Logger, BuildParams, and other services
