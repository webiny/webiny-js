---
name: api-list-published-entries
category: api/cms
type: UseCase
class: ListPublishedEntriesUseCase
import: webiny/api/cms/entry
description: >
  Programmatically list publishedentries.
---

# List Published Entries

Programmatically list publishedentries.

**Import:** `import { ListPublishedEntriesUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { ListPublishedEntriesUseCase } from "webiny/api/cms/entry";

// ListPublishedEntriesUseCase.Interface
type Interface = IListPublishedEntriesUseCase;

// ListPublishedEntriesUseCase.Error
type Error = UseCaseError;

// ListPublishedEntriesUseCase.Return
type Return = Promise<
        Result<IListEntriesResult<T>, UseCaseError>
    >;

// ListPublishedEntriesUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListPublishedEntriesUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-published-entries.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
