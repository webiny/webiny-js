---
name: api-get-page-by-id
category: api/website-builder
type: UseCase
class: GetPageByIdUseCase
import: webiny/api/website-builder/page
description: >
  Programmatically get pagebyid.
---

# Get Page By Id

Programmatically get pagebyid.

**Import:** `import { GetPageByIdUseCase } from "webiny/api/website-builder/page";`

## Types

```typescript
import { GetPageByIdUseCase } from "webiny/api/website-builder/page";

// GetPageByIdUseCase.Interface
type Interface = IGetPageByIdUseCase;

// GetPageByIdUseCase.Error
type Error = UseCaseError;

// GetPageByIdUseCase.Return
type Return = Promise<Result<WbPage, UseCaseError>>;

// GetPageByIdUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetPageByIdUseCase } from "webiny/api/website-builder/page";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-page-by-id.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
