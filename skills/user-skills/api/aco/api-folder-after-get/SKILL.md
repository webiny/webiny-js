---
name: api-folder-after-get
category: api/aco
type: EventHandler
class: FolderAfterGetEventHandler
import: webiny/api/aco/folder
description: >
  React after folder is getd. Side effects, notifications, external sync.
---

# Folder After Get

React after folder is getd. Side effects, notifications, external sync.

**Import:** `import { FolderAfterGetEventHandler as Handler } from "webiny/api/aco/folder";`
**Fires:** After folder is getd
**Timing:** after

## Types

```typescript
import { FolderAfterGetEventHandler as Handler } from "webiny/api/aco/folder";

// FolderAfterGetEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FolderAfterGetEventHandler.Event
type Event = DomainEvent<FolderAfterGetPayload>;

// FolderAfterGetEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FolderAfterGetEventHandler as Handler } from "webiny/api/aco/folder";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/folder-after-get.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-folder-before-get` — intercept before folder get
- `dependency-injection` — inject Logger, BuildParams, and other services
