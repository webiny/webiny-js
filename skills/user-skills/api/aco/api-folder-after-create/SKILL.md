---
name: api-folder-after-create
category: api/aco
type: EventHandler
class: FolderAfterCreateEventHandler
import: webiny/api/aco/folder
description: >
  React after folder is created. Side effects, notifications, external sync.
---

# Folder After Create

React after folder is created. Side effects, notifications, external sync.

**Import:** `import { FolderAfterCreateEventHandler as Handler } from "webiny/api/aco/folder";`
**Fires:** After folder is created
**Timing:** after

## Types

```typescript
import { FolderAfterCreateEventHandler as Handler } from "webiny/api/aco/folder";

// FolderAfterCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FolderAfterCreateEventHandler.Event
type Event = DomainEvent<FolderAfterCreatePayload>;

// FolderAfterCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FolderAfterCreateEventHandler as Handler } from "webiny/api/aco/folder";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/folder-after-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-folder-before-create` — intercept before folder create
- `dependency-injection` — inject Logger, BuildParams, and other services
