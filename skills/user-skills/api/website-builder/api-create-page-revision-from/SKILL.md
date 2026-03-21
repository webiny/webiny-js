---
name: api-create-page-revision-from
category: api/website-builder
type: UseCase
class: CreatePageRevisionFromUseCase
import: webiny/api/website-builder/page
description: >
  Programmatically create pagerevisionfrom.
---

# Create Page Revision From

Programmatically create pagerevisionfrom.

**Import:** `import { CreatePageRevisionFromUseCase } from "webiny/api/website-builder/page";`

## Types

```typescript
import { CreatePageRevisionFromUseCase } from "webiny/api/website-builder/page";

// CreatePageRevisionFromUseCase.Interface
type Interface = ICreatePageRevisionFromUseCase;

// CreatePageRevisionFromUseCase.Error
type Error = UseCaseError;

// CreatePageRevisionFromUseCase.Return
type Return = Promise<Result<WbPage, UseCaseError>>;

// CreatePageRevisionFromUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreatePageRevisionFromUseCase } from "webiny/api/website-builder/page";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-page-revision-from.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
