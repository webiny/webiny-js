---
name: api-model-before-create
category: api/cms
type: EventHandler
class: ModelBeforeCreateEventHandler
import: webiny/api/cms/model
description: >
  Intercept model create before it is persisted. Validate, transform, or reject.
---

# Model Before Create

Intercept model create before it is persisted. Validate, transform, or reject.

**Import:** `import { ModelBeforeCreateEventHandler as Handler } from "webiny/api/cms/model";`
**Fires:** Before model is created
**Timing:** before

## Types

```typescript
import { ModelBeforeCreateEventHandler as Handler } from "webiny/api/cms/model";

// ModelBeforeCreateEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// ModelBeforeCreateEventHandler.Event
// Event payload:
export interface ModelBeforeCreateEventPayload {
    model: CmsModel;
    input: CmsModelCreateInput;
}

// ModelBeforeCreateEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ModelBeforeCreateEventHandler as Handler } from "webiny/api/cms/model";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/model-before-create.ts"} />
```

## Notes

- Model handlers affect all content models — use with caution
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-model-after-create` — react after model create
- `dependency-injection` — inject Logger, BuildParams, and other services
