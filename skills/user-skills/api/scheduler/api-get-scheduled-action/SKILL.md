---
name: api-get-scheduled-action
category: api/scheduler
type: UseCase
class: GetScheduledActionUseCase
import: webiny/api/scheduler
description: >
  Programmatically get scheduledaction.
---

# Get Scheduled Action

Programmatically get scheduledaction.

**Import:** `import { GetScheduledActionUseCase } from "webiny/api/scheduler";`

## Types

```typescript
import { GetScheduledActionUseCase } from "webiny/api/scheduler";

// GetScheduledActionUseCase.Interface

// GetScheduledActionUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetScheduledActionUseCase } from "webiny/api/scheduler";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-scheduled-action.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
