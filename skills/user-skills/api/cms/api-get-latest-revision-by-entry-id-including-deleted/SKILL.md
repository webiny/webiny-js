---
name: api-get-latest-revision-by-entry-id-including-deleted
category: api/cms
type: UseCase
class: GetLatestRevisionByEntryIdIncludingDeletedUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get latestrevisionbyentryidincludingdeleted.
---

# Get Latest Revision By Entry Id Including Deleted

Programmatically get latestrevisionbyentryidincludingdeleted.

**Import:** `import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "webiny/api/cms/entry";

// GetLatestRevisionByEntryIdIncludingDeletedUseCase.Interface
type Interface = IGetLatestRevisionByEntryIdBaseUseCase;

// GetLatestRevisionByEntryIdIncludingDeletedUseCase.Error
type Error = UseCaseError;

// GetLatestRevisionByEntryIdIncludingDeletedUseCase.Return
type Return = Promise<Result<CmsEntry<T>, UseCaseError>>;

// GetLatestRevisionByEntryIdIncludingDeletedUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-latest-revision-by-entry-id-including-deleted.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
