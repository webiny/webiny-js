---
name: api-delete-entry-revision
category: api/cms
type: UseCase
class: DeleteEntryRevisionUseCase
import: webiny/api/cms/entry
description: >
  Programmatically delete entryrevision.
---

# Delete Entry Revision

Programmatically delete entryrevision.

**Import:** `import { DeleteEntryRevisionUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { DeleteEntryRevisionUseCase } from "webiny/api/cms/entry";

// DeleteEntryRevisionUseCase.Interface
type Interface = IDeleteEntryRevisionUseCase;

// DeleteEntryRevisionUseCase.Error
type Error = UseCaseError;

// DeleteEntryRevisionUseCase.Return
type Return = Promise<Result<void, UseCaseError>>;

// DeleteEntryRevisionUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeleteEntryRevisionUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-entry-revision.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
