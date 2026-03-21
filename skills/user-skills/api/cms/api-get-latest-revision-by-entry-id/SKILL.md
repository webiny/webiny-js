---
name: api-get-latest-revision-by-entry-id
category: api/cms
type: UseCase
class: GetLatestRevisionByEntryIdUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get latestrevisionbyentryid.
---

# Get Latest Revision By Entry Id

Programmatically get latestrevisionbyentryid.

**Import:** `import { GetLatestRevisionByEntryIdUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetLatestRevisionByEntryIdUseCase } from "webiny/api/cms/entry";

// GetLatestRevisionByEntryIdUseCase.Interface
type Interface = IGetLatestRevisionByEntryIdBaseUseCase;

// GetLatestRevisionByEntryIdUseCase.Error
type Error = UseCaseError;

// GetLatestRevisionByEntryIdUseCase.Return
type Return = Promise<Result<CmsEntry<T>, UseCaseError>>;

// GetLatestRevisionByEntryIdUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetLatestRevisionByEntryIdUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-latest-revision-by-entry-id.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
