---
name: api-file-before-delete
category: api/file-manager
type: EventHandler
class: FileBeforeDeleteEventHandler
import: webiny/api/file-manager/file
description: >
  Intercept file delete before it is persisted. Validate, transform, or reject.
---

# File Before Delete

Intercept file delete before it is persisted. Validate, transform, or reject.

**Import:** `import { FileBeforeDeleteEventHandler as Handler } from "webiny/api/file-manager/file";`
**Fires:** Before file is deleted
**Timing:** before

## Types

```typescript
import { FileBeforeDeleteEventHandler as Handler } from "webiny/api/file-manager/file";

// FileBeforeDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FileBeforeDeleteEventHandler.Event
// Event payload:
export interface FileBeforeDeletePayload {
    file: File;
}

// FileBeforeDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FileBeforeDeleteEventHandler as Handler } from "webiny/api/file-manager/file";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/file-before-delete.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-file-after-delete` — react after file delete
- `dependency-injection` — inject Logger, BuildParams, and other services
