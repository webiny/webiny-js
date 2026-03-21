---
name: api-get-latest-deleted-revision-by-entry-id
category: api/cms
type: UseCase
class: GetLatestDeletedRevisionByEntryIdUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get latestdeletedrevisionbyentryid.
---

# Get Latest Deleted Revision By Entry Id

Programmatically get latestdeletedrevisionbyentryid.

**Import:** `import { GetLatestDeletedRevisionByEntryIdUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetLatestDeletedRevisionByEntryIdUseCase } from "webiny/api/cms/entry";

// GetLatestDeletedRevisionByEntryIdUseCase.Interface
type Interface = IGetLatestRevisionByEntryIdBaseUseCase;

// GetLatestDeletedRevisionByEntryIdUseCase.Error
type Error = UseCaseError;

// GetLatestDeletedRevisionByEntryIdUseCase.Return
type Return = Promise<Result<CmsEntry<T>, UseCaseError>>;

// GetLatestDeletedRevisionByEntryIdUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetLatestDeletedRevisionByEntryIdUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-latest-deleted-revision-by-entry-id.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
