---
name: api-file-after-update
category: api/file-manager
type: EventHandler
class: FileAfterUpdateEventHandler
import: webiny/api/file-manager/file
description: >
  React after file is updated. Side effects, notifications, external sync.
---

# File After Update

React after file is updated. Side effects, notifications, external sync.

**Import:** `import { FileAfterUpdateEventHandler as Handler } from "webiny/api/file-manager/file";`
**Fires:** After file is updated
**Timing:** after

## Types

```typescript
import { FileAfterUpdateEventHandler as Handler } from "webiny/api/file-manager/file";

// FileAfterUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FileAfterUpdateEventHandler.Event
// Event payload:
export interface FileAfterUpdatePayload {
    original: File;
    file: File;
    input: UpdateFileInput;
}

// FileAfterUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FileAfterUpdateEventHandler as Handler } from "webiny/api/file-manager/file";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/file-after-update.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-file-before-update` — intercept before file update
- `dependency-injection` — inject Logger, BuildParams, and other services
