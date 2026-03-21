---
name: api-get-published-entries-by-ids
category: api/cms
type: UseCase
class: GetPublishedEntriesByIdsUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get publishedentriesbyids.
---

# Get Published Entries By Ids

Programmatically get publishedentriesbyids.

**Import:** `import { GetPublishedEntriesByIdsUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetPublishedEntriesByIdsUseCase } from "webiny/api/cms/entry";

// GetPublishedEntriesByIdsUseCase.Interface
type Interface = IGetPublishedEntriesByIdsUseCase;

// GetPublishedEntriesByIdsUseCase.Error
type Error = UseCaseError;

// GetPublishedEntriesByIdsUseCase.Return
type Return = Promise<Result<CmsEntry<T>[], UseCaseError>>;

// GetPublishedEntriesByIdsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetPublishedEntriesByIdsUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-published-entries-by-ids.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
