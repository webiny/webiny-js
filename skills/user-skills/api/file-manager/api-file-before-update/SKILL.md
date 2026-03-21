---
name: api-file-before-update
category: api/file-manager
type: EventHandler
class: FileBeforeUpdateEventHandler
import: webiny/api/file-manager/file
description: >
  Intercept file update before it is persisted. Validate, transform, or reject.
---

# File Before Update

Intercept file update before it is persisted. Validate, transform, or reject.

**Import:** `import { FileBeforeUpdateEventHandler as Handler } from "webiny/api/file-manager/file";`
**Fires:** Before file is updated
**Timing:** before

## Types

```typescript
import { FileBeforeUpdateEventHandler as Handler } from "webiny/api/file-manager/file";

// FileBeforeUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FileBeforeUpdateEventHandler.Event
// Event payload:
export interface FileBeforeUpdatePayload {
    original: File;
    file: File;
    input: UpdateFileInput;
}

// FileBeforeUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FileBeforeUpdateEventHandler as Handler } from "webiny/api/file-manager/file";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/file-before-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-file-after-update` — react after file update
- `dependency-injection` — inject Logger, BuildParams, and other services
