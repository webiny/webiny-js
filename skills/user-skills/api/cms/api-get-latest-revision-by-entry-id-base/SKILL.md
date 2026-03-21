---
name: api-get-latest-revision-by-entry-id-base
category: api/cms
type: UseCase
class: GetLatestRevisionByEntryIdBaseUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get latestrevisionbyentryidbase.
---

# Get Latest Revision By Entry Id Base

Programmatically get latestrevisionbyentryidbase.

**Import:** `import { GetLatestRevisionByEntryIdBaseUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetLatestRevisionByEntryIdBaseUseCase } from "webiny/api/cms/entry";

// GetLatestRevisionByEntryIdBaseUseCase.Interface
type Interface = IGetLatestRevisionByEntryIdBaseUseCase;

// GetLatestRevisionByEntryIdBaseUseCase.Error
type Error = UseCaseError;

// GetLatestRevisionByEntryIdBaseUseCase.Return
type Return = Promise<Result<CmsEntry<T>, UseCaseError>>;

// GetLatestRevisionByEntryIdBaseUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetLatestRevisionByEntryIdBaseUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-latest-revision-by-entry-id-base.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
