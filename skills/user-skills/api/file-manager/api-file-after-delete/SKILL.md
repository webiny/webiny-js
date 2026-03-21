---
name: api-file-after-delete
category: api/file-manager
type: EventHandler
class: FileAfterDeleteEventHandler
import: webiny/api/file-manager/file
description: >
  React after file is deleted. Side effects, notifications, external sync.
---

# File After Delete

React after file is deleted. Side effects, notifications, external sync.

**Import:** `import { FileAfterDeleteEventHandler as Handler } from "webiny/api/file-manager/file";`
**Fires:** After file is deleted
**Timing:** after

## Types

```typescript
import { FileAfterDeleteEventHandler as Handler } from "webiny/api/file-manager/file";

// FileAfterDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FileAfterDeleteEventHandler.Event
// Event payload:
export interface FileAfterDeletePayload {
    file: File;
}

// FileAfterDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FileAfterDeleteEventHandler as Handler } from "webiny/api/file-manager/file";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/file-after-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-file-before-delete` — intercept before file delete
- `dependency-injection` — inject Logger, BuildParams, and other services
