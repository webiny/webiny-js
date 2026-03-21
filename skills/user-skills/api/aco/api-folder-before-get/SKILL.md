---
name: api-folder-before-get
category: api/aco
type: EventHandler
class: FolderBeforeGetEventHandler
import: webiny/api/aco/folder
description: >
  Intercept folder get before it is persisted. Validate, transform, or reject.
---

# Folder Before Get

Intercept folder get before it is persisted. Validate, transform, or reject.

**Import:** `import { FolderBeforeGetEventHandler as Handler } from "webiny/api/aco/folder";`
**Fires:** Before folder is getd
**Timing:** before

## Types

```typescript
import { FolderBeforeGetEventHandler as Handler } from "webiny/api/aco/folder";

// FolderBeforeGetEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FolderBeforeGetEventHandler.Event
type Event = DomainEvent<FolderBeforeGetPayload>;

// FolderBeforeGetEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FolderBeforeGetEventHandler as Handler } from "webiny/api/aco/folder";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/folder-before-get.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-folder-after-get` — react after folder get
- `dependency-injection` — inject Logger, BuildParams, and other services
