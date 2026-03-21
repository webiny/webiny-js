---
name: api-get-latest-entries-by-ids
category: api/cms
type: UseCase
class: GetLatestEntriesByIdsUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get latestentriesbyids.
---

# Get Latest Entries By Ids

Programmatically get latestentriesbyids.

**Import:** `import { GetLatestEntriesByIdsUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetLatestEntriesByIdsUseCase } from "webiny/api/cms/entry";

// GetLatestEntriesByIdsUseCase.Interface
type Interface = IGetLatestEntriesByIdsUseCase;

// GetLatestEntriesByIdsUseCase.Error
type Error = UseCaseError;

// GetLatestEntriesByIdsUseCase.Return
type Return = Promise<Result<CmsEntry<T>[], UseCaseError>>;

// GetLatestEntriesByIdsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetLatestEntriesByIdsUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-latest-entries-by-ids.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
