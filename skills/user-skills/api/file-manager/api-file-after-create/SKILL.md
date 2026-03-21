---
name: api-file-after-create
category: api/file-manager
type: EventHandler
class: FileAfterCreateEventHandler
import: webiny/api/file-manager/file
description: >
  React after file is created. Side effects, notifications, external sync.
---

# File After Create

React after file is created. Side effects, notifications, external sync.

**Import:** `import { FileAfterCreateEventHandler as Handler } from "webiny/api/file-manager/file";`
**Fires:** After file is created
**Timing:** after

## Types

```typescript
import { FileAfterCreateEventHandler as Handler } from "webiny/api/file-manager/file";

// FileAfterCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// FileAfterCreateEventHandler.Event
// Event payload:
export interface FileAfterCreatePayload {
    file: File;
    meta?: Record<string, any>;
}

// FileAfterCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { FileAfterCreateEventHandler as Handler } from "webiny/api/file-manager/file";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/file-after-create.ts"} />
```

## Notes

- Handler fires for ALL models/entities — always filter by relevant ID
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-file-before-create` — intercept before file create
- `dependency-injection` — inject Logger, BuildParams, and other services
