---
name: api-file-after-batch-create
category: api/file-manager
type: EventHandler
class: FileAfterBatchCreateEventHandler
import: webiny/api/file-manager/file
description: >
  React after file is batch-created. Side effects, notifications, external sync.
---

# File After Batch-create

React after file is batch-created. Side effects, notifications, external sync.

**Import:** `import { FileAfterBatchCreateEventHandler as Handler } from "webiny/api/file-manager/file";`
**Fires:** After file is batch-created
**Timing:** after

## Types

```typescript
import { FileAfterBatchCreateEventHandler as Handler } from "webiny/api/file-manager/file";

// FileAfterBatchCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FileAfterBatchCreateEventHandler.Event
// Event payload:
export interface FileAfterBatchCreatePayload {
    files: File[];
    meta?: Record<string, any>;
}

// FileAfterBatchCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FileAfterBatchCreateEventHandler as Handler } from "webiny/api/file-manager/file";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/file-after-batch-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-file-before-batch-create` — intercept before file batch-create
- `dependency-injection` — inject Logger, BuildParams, and other services
