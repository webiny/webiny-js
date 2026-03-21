---
name: api-file-before-batch-create
category: api/file-manager
type: EventHandler
class: FileBeforeBatchCreateEventHandler
import: webiny/api/file-manager/file
description: >
  Intercept file batch-create before it is persisted. Validate, transform, or reject.
---

# File Before Batch-create

Intercept file batch-create before it is persisted. Validate, transform, or reject.

**Import:** `import { FileBeforeBatchCreateEventHandler as Handler } from "webiny/api/file-manager/file";`
**Fires:** Before file is batch-created
**Timing:** before

## Types

```typescript
import { FileBeforeBatchCreateEventHandler as Handler } from "webiny/api/file-manager/file";

// FileBeforeBatchCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FileBeforeBatchCreateEventHandler.Event
// Event payload:
export interface FileBeforeBatchCreatePayload {
    files: FileInput[];
    meta?: Record<string, any>;
}

// FileBeforeBatchCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FileBeforeBatchCreateEventHandler as Handler } from "webiny/api/file-manager/file";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/file-before-batch-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-file-after-batch-create` — react after file batch-create
- `dependency-injection` — inject Logger, BuildParams, and other services
