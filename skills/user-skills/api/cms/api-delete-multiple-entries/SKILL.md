---
name: api-delete-multiple-entries
category: api/cms
type: UseCase
class: DeleteMultipleEntriesUseCase
import: webiny/api/cms/entry
description: >
  Programmatically delete multipleentries.
---

# Delete Multiple Entries

Programmatically delete multipleentries.

**Import:** `import { DeleteMultipleEntriesUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { DeleteMultipleEntriesUseCase } from "webiny/api/cms/entry";

// DeleteMultipleEntriesUseCase.Interface
type Interface = IDeleteMultipleEntriesUseCase;

// DeleteMultipleEntriesUseCase.Error
type Error = UseCaseError;

// DeleteMultipleEntriesUseCase.Return
type Return = Promise<Result<IDeleteMultipleEntriesUseCaseResultItem[], UseCaseError>>;

// DeleteMultipleEntriesUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeleteMultipleEntriesUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-multiple-entries.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
