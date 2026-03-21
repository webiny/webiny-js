---
name: api-delete-entry
category: api/cms
type: UseCase
class: DeleteEntryUseCase
import: webiny/api/cms/entry
description: >
  Programmatically delete entry.
---

# Delete Entry

Programmatically delete entry.

**Import:** `import { DeleteEntryUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { DeleteEntryUseCase } from "webiny/api/cms/entry";

// DeleteEntryUseCase.Interface
type Interface = IDeleteEntryUseCase;

// DeleteEntryUseCase.Options
type Options = CmsDeleteEntryOptions;

// DeleteEntryUseCase.Error
type Error = UseCaseError;

// DeleteEntryUseCase.Return
type Return = Promise<Result<void, UseCaseError>>;

// DeleteEntryUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeleteEntryUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-entry.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
