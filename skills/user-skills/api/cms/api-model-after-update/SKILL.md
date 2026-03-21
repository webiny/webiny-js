---
name: api-model-after-update
category: api/cms
type: EventHandler
class: ModelAfterUpdateEventHandler
import: webiny/api/cms/model
description: >
  React after model is updated. Side effects, notifications, external sync.
---

# Model After Update

React after model is updated. Side effects, notifications, external sync.

**Import:** `import { ModelAfterUpdateEventHandler as Handler } from "webiny/api/cms/model";`
**Fires:** After model is updated
**Timing:** after

## Types

```typescript
import { ModelAfterUpdateEventHandler as Handler } from "webiny/api/cms/model";

// ModelAfterUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// ModelAfterUpdateEventHandler.Event
// Event payload:
export interface ModelAfterUpdateEventPayload {
    model: CmsModel;
    original: CmsModel;
}

// ModelAfterUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ModelAfterUpdateEventHandler as Handler } from "webiny/api/cms/model";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/model-after-update.ts"} />
```

## Notes

- Model handlers affect all content models — use with caution
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-model-before-update` — intercept before model update
- `dependency-injection` — inject Logger, BuildParams, and other services
