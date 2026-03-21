---
name: api-schedule-unpublish-page
category: api/website-builder
type: UseCase
class: ScheduleUnpublishPageUseCase
import: webiny/api/website-builder/scheduler
description: >
  Programmatically schedule unpublishpage.
---

# Schedule Unpublish Page

Programmatically schedule unpublishpage.

**Import:** `import { ScheduleUnpublishPageUseCase } from "webiny/api/website-builder/scheduler";`

## Types

```typescript
import { ScheduleUnpublishPageUseCase } from "webiny/api/website-builder/scheduler";

// ScheduleUnpublishPageUseCase.Interface
type Interface = IScheduleUnpublishPageUseCase;

// ScheduleUnpublishPageUseCase.Error
type Error = ScheduleActionError;

// ScheduleUnpublishPageUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ScheduleUnpublishPageUseCase } from "webiny/api/website-builder/scheduler";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/schedule-unpublish-page.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
