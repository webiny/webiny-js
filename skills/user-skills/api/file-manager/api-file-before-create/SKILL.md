---
name: api-file-before-create
category: api/file-manager
type: EventHandler
class: FileBeforeCreateEventHandler
import: webiny/api/file-manager/file
description: >
  Intercept file create before it is persisted. Validate, transform, or reject.
---

# File Before Create

Intercept file create before it is persisted. Validate, transform, or reject.

**Import:** `import { FileBeforeCreateEventHandler as Handler } from "webiny/api/file-manager/file";`
**Fires:** Before file is created
**Timing:** before

## Types

```typescript
import { FileBeforeCreateEventHandler as Handler } from "webiny/api/file-manager/file";

// FileBeforeCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FileBeforeCreateEventHandler.Event
// Event payload:
export interface FileBeforeCreatePayload {
    file: FileInput;
    meta?: Record<string, any>;
}

// FileBeforeCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FileBeforeCreateEventHandler as Handler } from "webiny/api/file-manager/file";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/file-before-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-file-after-create` — react after file create
- `dependency-injection` — inject Logger, BuildParams, and other services
