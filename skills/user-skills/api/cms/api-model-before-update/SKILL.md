---
name: api-model-before-update
category: api/cms
type: EventHandler
class: ModelBeforeUpdateEventHandler
import: webiny/api/cms/model
description: >
  Intercept model update before it is persisted. Validate, transform, or reject.
---

# Model Before Update

Intercept model update before it is persisted. Validate, transform, or reject.

**Import:** `import { ModelBeforeUpdateEventHandler as Handler } from "webiny/api/cms/model";`
**Fires:** Before model is updated
**Timing:** before

## Types

```typescript
import { ModelBeforeUpdateEventHandler as Handler } from "webiny/api/cms/model";

// ModelBeforeUpdateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// ModelBeforeUpdateEventHandler.Event
// Event payload:
export interface ModelBeforeUpdateEventPayload {
    model: CmsModel;
    original: CmsModel;
    input: CmsModelUpdateInput;
}

// ModelBeforeUpdateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ModelBeforeUpdateEventHandler as Handler } from "webiny/api/cms/model";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/model-before-update.ts"} />
```

## Notes

- Model handlers affect all content models — use with caution
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-model-after-update` — react after model update
- `dependency-injection` — inject Logger, BuildParams, and other services
