---
name: api-folder-after-update
category: api/aco
type: EventHandler
class: FolderAfterUpdateEventHandler
import: webiny/api/aco/folder
description: >
  React after folder is updated. Side effects, notifications, external sync.
---

# Folder After Update

React after folder is updated. Side effects, notifications, external sync.

**Import:** `import { FolderAfterUpdateEventHandler as Handler } from "webiny/api/aco/folder";`
**Fires:** After folder is updated
**Timing:** after

## Types

```typescript
import { FolderAfterUpdateEventHandler as Handler } from "webiny/api/aco/folder";

// FolderAfterUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FolderAfterUpdateEventHandler.Event
type Event = DomainEvent<FolderAfterUpdatePayload>;

// FolderAfterUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FolderAfterUpdateEventHandler as Handler } from "webiny/api/aco/folder";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/folder-after-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-folder-before-update` — intercept before folder update
- `dependency-injection` — inject Logger, BuildParams, and other services
