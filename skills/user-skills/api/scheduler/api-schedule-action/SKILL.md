---
name: api-schedule-action
category: api/scheduler
type: UseCase
class: ScheduleActionUseCase
import: webiny/api/scheduler
description: >
  Programmatically schedule action.
---

# Schedule Action

Programmatically schedule action.

**Import:** `import { ScheduleActionUseCase } from "webiny/api/scheduler";`

## Types

```typescript
import { ScheduleActionUseCase } from "webiny/api/scheduler";

// ScheduleActionUseCase.Interface

// ScheduleActionUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ScheduleActionUseCase } from "webiny/api/scheduler";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/schedule-action.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
