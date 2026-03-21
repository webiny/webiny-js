---
name: api-execute-scheduled-action-execute-scheduled-action
category: api/scheduler
type: UseCase
class: ExecuteScheduledActionUseCase
import: webiny/api/scheduler
description: >
  Programmatically execute-scheduled-action executescheduledaction.
---

# Execute-scheduled-action Execute Scheduled Action

Programmatically execute-scheduled-action executescheduledaction.

**Import:** `import { ExecuteScheduledActionUseCase } from "webiny/api/scheduler";`

## Types

```typescript
import { ExecuteScheduledActionUseCase } from "webiny/api/scheduler";

// ExecuteScheduledActionUseCase.Interface

// ExecuteScheduledActionUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ExecuteScheduledActionUseCase } from "webiny/api/scheduler";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/execute-scheduled-action-execute-scheduled-action.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
