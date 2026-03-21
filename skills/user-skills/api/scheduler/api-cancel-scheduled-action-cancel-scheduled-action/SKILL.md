---
name: api-cancel-scheduled-action-cancel-scheduled-action
category: api/scheduler
type: UseCase
class: CancelScheduledActionUseCase
import: webiny/api/scheduler
description: >
  Programmatically cancel-scheduled-action cancelscheduledaction.
---

# Cancel-scheduled-action Cancel Scheduled Action

Programmatically cancel-scheduled-action cancelscheduledaction.

**Import:** `import { CancelScheduledActionUseCase } from "webiny/api/scheduler";`

## Types

```typescript
import { CancelScheduledActionUseCase } from "webiny/api/scheduler";

// CancelScheduledActionUseCase.Interface

// CancelScheduledActionUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CancelScheduledActionUseCase } from "webiny/api/scheduler";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/cancel-scheduled-action-cancel-scheduled-action.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
