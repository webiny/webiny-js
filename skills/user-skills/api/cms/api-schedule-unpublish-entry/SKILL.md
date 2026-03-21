---
name: api-schedule-unpublish-entry
category: api/cms
type: UseCase
class: ScheduleUnpublishEntryUseCase
import: webiny/api/cms/scheduler
description: >
  Programmatically schedule unpublishentry.
---

# Schedule Unpublish Entry

Programmatically schedule unpublishentry.

**Import:** `import { ScheduleUnpublishEntryUseCase } from "webiny/api/cms/scheduler";`

## Types

```typescript
import { ScheduleUnpublishEntryUseCase } from "webiny/api/cms/scheduler";

// ScheduleUnpublishEntryUseCase.Interface
type Interface = IScheduleUnpublishEntryUseCase;

// ScheduleUnpublishEntryUseCase.Error
type Error = ScheduleActionError;

// ScheduleUnpublishEntryUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ScheduleUnpublishEntryUseCase } from "webiny/api/cms/scheduler";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/schedule-unpublish-entry.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
