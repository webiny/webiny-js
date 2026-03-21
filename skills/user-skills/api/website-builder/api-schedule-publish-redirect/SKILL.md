---
name: api-schedule-publish-redirect
category: api/website-builder
type: UseCase
class: SchedulePublishRedirectUseCase
import: webiny/api/website-builder/scheduler
description: >
  Programmatically schedule publishredirect.
---

# Schedule Publish Redirect

Programmatically schedule publishredirect.

**Import:** `import { SchedulePublishRedirectUseCase } from "webiny/api/website-builder/scheduler";`

## Types

```typescript
import { SchedulePublishRedirectUseCase } from "webiny/api/website-builder/scheduler";

// SchedulePublishRedirectUseCase.Interface
type Interface = ISchedulePublishRedirectUseCase;

// SchedulePublishRedirectUseCase.Error
type Error = ScheduleActionError;

// SchedulePublishRedirectUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { SchedulePublishRedirectUseCase } from "webiny/api/website-builder/scheduler";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/schedule-publish-redirect.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
