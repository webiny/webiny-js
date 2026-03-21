---
name: api-list-pages
category: api/website-builder
type: UseCase
class: ListPagesUseCase
import: webiny/api/website-builder/page
description: >
  Programmatically list pages.
---

# List Pages

Programmatically list pages.

**Import:** `import { ListPagesUseCase } from "webiny/api/website-builder/page";`

## Types

```typescript
import { ListPagesUseCase } from "webiny/api/website-builder/page";

// ListPagesUseCase.Interface
type Interface = IListPagesUseCase;

// ListPagesUseCase.Error
type Error = UseCaseError;

// ListPagesUseCase.Return
type Return = Promise<Result<IListPagesResult, UseCaseError>>;

// ListPagesUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListPagesUseCase } from "webiny/api/website-builder/page";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-pages.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
