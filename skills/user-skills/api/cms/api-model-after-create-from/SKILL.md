---
name: api-model-after-create-from
category: api/cms
type: EventHandler
class: ModelAfterCreateFromEventHandler
import: webiny/api/cms/model
description: >
  React after model is create-fromd. Side effects, notifications, external sync.
---

# Model After Create-from

React after model is create-fromd. Side effects, notifications, external sync.

**Import:** `import { ModelAfterCreateFromEventHandler as Handler } from "webiny/api/cms/model";`
**Fires:** After model is create-fromd
**Timing:** after

## Types

```typescript
import { ModelAfterCreateFromEventHandler as Handler } from "webiny/api/cms/model";

// ModelAfterCreateFromEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// ModelAfterCreateFromEventHandler.Event
// Event payload:
export interface ModelAfterCreateFromEventPayload {
    model: CmsModel;
    original: CmsModel;
}

// ModelAfterCreateFromEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ModelAfterCreateFromEventHandler as Handler } from "webiny/api/cms/model";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/model-after-create-from.ts"} />
```

## Notes

- Model handlers affect all content models — use with caution
- `event.payload` reflects the persisted state — do not mutate
- Use for side effects: notifications, sync, cache invalidation

## Related Skills

- `api-model-before-create-from` — intercept before model create-from
- `dependency-injection` — inject Logger, BuildParams, and other services
