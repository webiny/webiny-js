---
name: api-get-previous-revision-by-entry-id-base
category: api/cms
type: UseCase
class: GetPreviousRevisionByEntryIdBaseUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get previousrevisionbyentryidbase.
---

# Get Previous Revision By Entry Id Base

Programmatically get previousrevisionbyentryidbase.

**Import:** `import { GetPreviousRevisionByEntryIdBaseUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetPreviousRevisionByEntryIdBaseUseCase } from "webiny/api/cms/entry";

// GetPreviousRevisionByEntryIdBaseUseCase.Interface
type Interface = IGetPreviousRevisionByEntryIdBaseUseCase;

// GetPreviousRevisionByEntryIdBaseUseCase.Error
type Error = UseCaseError;

// GetPreviousRevisionByEntryIdBaseUseCase.Return
type Return = Promise<Result<CmsEntry<T>, UseCaseError>>;

// GetPreviousRevisionByEntryIdBaseUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetPreviousRevisionByEntryIdBaseUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-previous-revision-by-entry-id-base.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
