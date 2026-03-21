---
name: api-model-after-create
category: api/cms
type: EventHandler
class: ModelAfterCreateEventHandler
import: webiny/api/cms/model
description: >
  React after model is created. Side effects, notifications, external sync.
---

# Model After Create

React after model is created. Side effects, notifications, external sync.

**Import:** `import { ModelAfterCreateEventHandler as Handler } from "webiny/api/cms/model";`
**Fires:** After model is created
**Timing:** after

## Types

```typescript
import { ModelAfterCreateEventHandler as Handler } from "webiny/api/cms/model";

// ModelAfterCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// ModelAfterCreateEventHandler.Event
// Event payload:
export interface ModelAfterCreateEventPayload {
    model: CmsModel;
}

// ModelAfterCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ModelAfterCreateEventHandler as Handler } from "webiny/api/cms/model";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/model-after-create.ts"} />
```

## Notes

- Model handlers affect all content models — use with caution
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-model-before-create` — intercept before model create
- `dependency-injection` — inject Logger, BuildParams, and other services
