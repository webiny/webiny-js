---
name: api-get-page-by-path
category: api/website-builder
type: UseCase
class: GetPageByPathUseCase
import: webiny/api/website-builder/page
description: >
  Programmatically get pagebypath.
---

# Get Page By Path

Programmatically get pagebypath.

**Import:** `import { GetPageByPathUseCase } from "webiny/api/website-builder/page";`

## Types

```typescript
import { GetPageByPathUseCase } from "webiny/api/website-builder/page";

// GetPageByPathUseCase.Interface
type Interface = IGetPageByPathUseCase;

// GetPageByPathUseCase.Error
type Error = UseCaseError;

// GetPageByPathUseCase.Return
type Return = Promise<Result<WbPage, UseCaseError>>;

// GetPageByPathUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetPageByPathUseCase } from "webiny/api/website-builder/page";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-page-by-path.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
