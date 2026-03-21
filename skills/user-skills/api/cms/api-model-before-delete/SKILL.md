---
name: api-model-before-delete
category: api/cms
type: EventHandler
class: ModelBeforeDeleteEventHandler
import: webiny/api/cms/model
description: >
  Intercept model delete before it is persisted. Validate, transform, or reject.
---

# Model Before Delete

Intercept model delete before it is persisted. Validate, transform, or reject.

**Import:** `import { ModelBeforeDeleteEventHandler as Handler } from "webiny/api/cms/model";`
**Fires:** Before model is deleted
**Timing:** before

## Types

```typescript
import { ModelBeforeDeleteEventHandler as Handler } from "webiny/api/cms/model";

// ModelBeforeDeleteEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// ModelBeforeDeleteEventHandler.Event
// Event payload:
export interface ModelBeforeDeleteEventPayload {
    model: CmsModel;
}

// ModelBeforeDeleteEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ModelBeforeDeleteEventHandler as Handler } from "webiny/api/cms/model";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/model-before-delete.ts"} />
```

## Notes

- Model handlers affect all content models — use with caution
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-model-after-delete` — react after model delete
- `dependency-injection` — inject Logger, BuildParams, and other services
