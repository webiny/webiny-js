---
name: api-folder-before-create
category: api/aco
type: EventHandler
class: FolderBeforeCreateEventHandler
import: webiny/api/aco/folder
description: >
  Intercept folder create before it is persisted. Validate, transform, or reject.
---

# Folder Before Create

Intercept folder create before it is persisted. Validate, transform, or reject.

**Import:** `import { FolderBeforeCreateEventHandler as Handler } from "webiny/api/aco/folder";`
**Fires:** Before folder is created
**Timing:** before

## Types

```typescript
import { FolderBeforeCreateEventHandler as Handler } from "webiny/api/aco/folder";

// FolderBeforeCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FolderBeforeCreateEventHandler.Event
type Event = DomainEvent<FolderBeforeCreatePayload>;

// FolderBeforeCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FolderBeforeCreateEventHandler as Handler } from "webiny/api/aco/folder";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/folder-before-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-folder-after-create` — react after folder create
- `dependency-injection` — inject Logger, BuildParams, and other services
