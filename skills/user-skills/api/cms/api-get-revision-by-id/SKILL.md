---
name: api-get-revision-by-id
category: api/cms
type: UseCase
class: GetRevisionByIdUseCase
import: webiny/api/cms/entry
description: >
  Programmatically get revisionbyid.
---

# Get Revision By Id

Programmatically get revisionbyid.

**Import:** `import { GetRevisionByIdUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { GetRevisionByIdUseCase } from "webiny/api/cms/entry";

// GetRevisionByIdUseCase.Interface
type Interface = IGetRevisionByIdUseCase;

// GetRevisionByIdUseCase.Error
type Error = UseCaseError;

// GetRevisionByIdUseCase.Return
type Return = Promise<
        Result<CmsEntry<T>, UseCaseError>
    >;

// GetRevisionByIdUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetRevisionByIdUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-revision-by-id.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
