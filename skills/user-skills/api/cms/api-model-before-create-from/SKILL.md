---
name: api-model-before-create-from
category: api/cms
type: EventHandler
class: ModelBeforeCreateFromEventHandler
import: webiny/api/cms/model
description: >
  Intercept model create-from before it is persisted. Validate, transform, or reject.
---

# Model Before Create-from

Intercept model create-from before it is persisted. Validate, transform, or reject.

**Import:** `import { ModelBeforeCreateFromEventHandler as Handler } from "webiny/api/cms/model";`
**Fires:** Before model is create-fromd
**Timing:** before

## Types

```typescript
import { ModelBeforeCreateFromEventHandler as Handler } from "webiny/api/cms/model";

// ModelBeforeCreateFromEventHandler.Interface
interface Interface {
  handle(event: Event): Promise<void>;
}

// ModelBeforeCreateFromEventHandler.Event
// Event payload:
export interface ModelBeforeCreateFromEventPayload {
    model: CmsModel;
    original: CmsModel;
    input: CmsModelCreateFromInput;
}

// ModelBeforeCreateFromEventHandler.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ModelBeforeCreateFromEventHandler as Handler } from "webiny/api/cms/model";
import { Logger } from "webiny/api/logger";

<!-- TODO: Generate a realistic example for this handler -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/model-before-create-from.ts"} />
```

## Notes

- Model handlers affect all content models — use with caution
- `event.payload` may be mutable — write to it to set computed fields
- Throw an error to reject the operation

## Related Skills

- `api-model-after-create-from` — react after model create-from
- `dependency-injection` — inject Logger, BuildParams, and other services
