---
name: api-get-previous-revision-by-entry-id
category: api/cms
type: UseCase
class: GetPreviousRevisionByEntryIdUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get previousrevisionbyentryid.
---

# Get Previous Revision By Entry Id

Programmatically get previousrevisionbyentryid.

**Import:** `import { GetPreviousRevisionByEntryIdUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetPreviousRevisionByEntryIdUseCase } from "webiny/api/cms/entry";

// GetPreviousRevisionByEntryIdUseCase.Interface
type Interface = IGetPreviousRevisionByEntryIdBaseUseCase;

// GetPreviousRevisionByEntryIdUseCase.Error
type Error = UseCaseError;

// GetPreviousRevisionByEntryIdUseCase.Return
type Return = Promise<Result<CmsEntry<T>, UseCaseError>>;

// GetPreviousRevisionByEntryIdUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetPreviousRevisionByEntryIdUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-previous-revision-by-entry-id.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
