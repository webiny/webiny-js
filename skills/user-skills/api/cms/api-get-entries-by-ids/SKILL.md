---
name: api-get-entries-by-ids
category: api/cms
type: UseCase
class: GetEntriesByIdsUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get entriesbyids.
---

# Get Entries By Ids

Programmatically get entriesbyids.

**Import:** `import { GetEntriesByIdsUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetEntriesByIdsUseCase } from "webiny/api/cms/entry";

// GetEntriesByIdsUseCase.Interface
type Interface = IGetEntriesByIdsUseCase;

// GetEntriesByIdsUseCase.Error
type Error = UseCaseError;

// GetEntriesByIdsUseCase.Return
type Return = Promise<Result<CmsEntry<T>[], UseCaseError>>;

// GetEntriesByIdsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetEntriesByIdsUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-entries-by-ids.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
