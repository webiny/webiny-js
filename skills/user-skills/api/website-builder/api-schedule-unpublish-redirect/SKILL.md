---
name: api-schedule-unpublish-redirect
category: api/website-builder
type: UseCase
class: ScheduleUnpublishRedirectUseCase
import: webiny/api/website-builder/scheduler
description: >
  Programmatically schedule unpublishredirect.
---

# Schedule Unpublish Redirect

Programmatically schedule unpublishredirect.

**Import:** `import { ScheduleUnpublishRedirectUseCase } from "webiny/api/website-builder/scheduler";`

## Types

```typescript
import { ScheduleUnpublishRedirectUseCase } from "webiny/api/website-builder/scheduler";

// ScheduleUnpublishRedirectUseCase.Interface
type Interface = IScheduleUnpublishRedirectUseCase;

// ScheduleUnpublishRedirectUseCase.Error
type Error = ScheduleActionError;

// ScheduleUnpublishRedirectUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ScheduleUnpublishRedirectUseCase } from "webiny/api/website-builder/scheduler";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/schedule-unpublish-redirect.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
