---
name: api-get-revisions-by-entry-id
category: api/cms
type: UseCase
class: GetRevisionsByEntryIdUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get revisionsbyentryid.
---

# Get Revisions By Entry Id

Programmatically get revisionsbyentryid.

**Import:** `import { GetRevisionsByEntryIdUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetRevisionsByEntryIdUseCase } from "webiny/api/cms/entry";

// GetRevisionsByEntryIdUseCase.Interface
type Interface = IGetRevisionsByEntryIdUseCase;

// GetRevisionsByEntryIdUseCase.Error
type Error = UseCaseError;

// GetRevisionsByEntryIdUseCase.Return
type Return = Promise<Result<CmsEntry<T>[], UseCaseError>>;

// GetRevisionsByEntryIdUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetRevisionsByEntryIdUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-revisions-by-entry-id.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
