---
name: api-list-deleted-entries
category: api/cms
type: UseCase
class: ListDeletedEntriesUseCase
import: webiny/api/cms/entry
description: >
  Programmatically list deletedentries.
---

# List Deleted Entries

Programmatically list deletedentries.

**Import:** `import { ListDeletedEntriesUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { ListDeletedEntriesUseCase } from "webiny/api/cms/entry";

// ListDeletedEntriesUseCase.Interface
type Interface = IListDeletedEntriesUseCase;

// ListDeletedEntriesUseCase.Error
type Error = UseCaseError;

// ListDeletedEntriesUseCase.Return
type Return = Promise<
        Result<IListEntriesResult<T>, UseCaseError>
    >;

// ListDeletedEntriesUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListDeletedEntriesUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-deleted-entries.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
