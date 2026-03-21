---
name: api-list-latest-entries
category: api/cms
type: UseCase
class: ListLatestEntriesUseCase
import: webiny/api/cms/entry
description: >
  Programmatically list latestentries.
---

# List Latest Entries

Programmatically list latestentries.

**Import:** `import { ListLatestEntriesUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { ListLatestEntriesUseCase } from "webiny/api/cms/entry";

// ListLatestEntriesUseCase.Interface
type Interface = IListLatestEntriesUseCase;

// ListLatestEntriesUseCase.Error
type Error = UseCaseError;

// ListLatestEntriesUseCase.Return
type Return = Promise<
        Result<IListEntriesResult<T>, UseCaseError>
    >;

// ListLatestEntriesUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListLatestEntriesUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-latest-entries.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
