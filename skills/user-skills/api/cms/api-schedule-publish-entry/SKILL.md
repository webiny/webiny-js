---
name: api-schedule-publish-entry
category: api/cms
type: UseCase
class: SchedulePublishEntryUseCase
import: webiny/api/cms/scheduler
description: >
  Programmatically schedule publishentry.
---

# Schedule Publish Entry

Programmatically schedule publishentry.

**Import:** `import { SchedulePublishEntryUseCase } from "webiny/api/cms/scheduler";`

## Types

```typescript
import { SchedulePublishEntryUseCase } from "webiny/api/cms/scheduler";

// SchedulePublishEntryUseCase.Interface
type Interface = ISchedulePublishEntryUseCase;

// SchedulePublishEntryUseCase.Error
type Error = ScheduleActionError;

// SchedulePublishEntryUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { SchedulePublishEntryUseCase } from "webiny/api/cms/scheduler";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/schedule-publish-entry.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
