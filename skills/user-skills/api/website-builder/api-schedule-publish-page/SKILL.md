---
name: api-schedule-publish-page
category: api/website-builder
type: UseCase
class: SchedulePublishPageUseCase
import: webiny/api/website-builder/scheduler
description: >
  Programmatically schedule publishpage.
---

# Schedule Publish Page

Programmatically schedule publishpage.

**Import:** `import { SchedulePublishPageUseCase } from "webiny/api/website-builder/scheduler";`

## Types

```typescript
import { SchedulePublishPageUseCase } from "webiny/api/website-builder/scheduler";

// SchedulePublishPageUseCase.Interface
type Interface = ISchedulePublishPageUseCase;

// SchedulePublishPageUseCase.Error
type Error = ScheduleActionError;

// SchedulePublishPageUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { SchedulePublishPageUseCase } from "webiny/api/website-builder/scheduler";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/schedule-publish-page.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
