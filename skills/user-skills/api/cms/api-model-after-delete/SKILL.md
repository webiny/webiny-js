---
name: api-model-after-delete
category: api/cms
type: EventHandler
class: ModelAfterDeleteEventHandler
import: webiny/api/cms/model
description: >
  React after model is deleted. Side effects, notifications, external sync.
---

# Model After Delete

React after model is deleted. Side effects, notifications, external sync.

**Import:** `import { ModelAfterDeleteEventHandler as Handler } from "webiny/api/cms/model";`
**Fires:** After model is deleted
**Timing:** after

## Types

```typescript
import { ModelAfterDeleteEventHandler as Handler } from "webiny/api/cms/model";

// ModelAfterDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// ModelAfterDeleteEventHandler.Event
// Event payload:
export interface ModelAfterDeleteEventPayload {
    model: CmsModel;
}

// ModelAfterDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ModelAfterDeleteEventHandler as Handler } from "webiny/api/cms/model";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/model-after-delete.ts"} />
```

## Notes

- Model handlers affect all content models — use with caution
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-model-before-delete` — intercept before model delete
- `dependency-injection` — inject Logger, BuildParams, and other services
