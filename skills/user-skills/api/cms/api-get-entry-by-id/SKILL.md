---
name: api-get-entry-by-id
category: api/cms
type: UseCase
class: GetEntryByIdUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get entrybyid.
---

# Get Entry By Id

Programmatically get entrybyid.

**Import:** `import { GetEntryByIdUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetEntryByIdUseCase } from "webiny/api/cms/entry";

// GetEntryByIdUseCase.Interface
type Interface = IGetEntryByIdUseCase;

// GetEntryByIdUseCase.Error
type Error = UseCaseError;

// GetEntryByIdUseCase.Return
type Return = Promise<Result<CmsEntry<T>, UseCaseError>>;

// GetEntryByIdUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetEntryByIdUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-entry-by-id.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
