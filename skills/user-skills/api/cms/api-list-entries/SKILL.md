---
name: api-list-entries
category: api/cms
type: UseCase
class: ListEntriesUseCase
import: webiny/api/cms/entry
description: >
  Programmatically list entries.
---

# List Entries

Programmatically list entries.

**Import:** `import { ListEntriesUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { ListEntriesUseCase } from "webiny/api/cms/entry";

// ListEntriesUseCase.Interface
type Interface = IListEntriesUseCase;

// ListEntriesUseCase.Error
type Error = UseCaseError;

// ListEntriesUseCase.Return
type Return = Promise<
        Result<IListEntriesResult<T>, UseCaseError>
    >;

// ListEntriesUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListEntriesUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-entries.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
