---
name: api-list-scheduled-actions
category: api/scheduler
type: UseCase
class: ListScheduledActionsUseCase
import: webiny/api/scheduler
description: >
  Programmatically list scheduledactions.
---

# List Scheduled Actions

Programmatically list scheduledactions.

**Import:** `import { ListScheduledActionsUseCase } from "webiny/api/scheduler";`

## Types

```typescript
import { ListScheduledActionsUseCase } from "webiny/api/scheduler";

// ListScheduledActionsUseCase.Interface

// ListScheduledActionsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListScheduledActionsUseCase } from "webiny/api/scheduler";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-scheduled-actions.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
