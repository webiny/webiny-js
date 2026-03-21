---
name: api-list-models
category: api/cms
type: UseCase
class: ListModelsUseCase
import: webiny/api/cms/model
description: >
  Programmatically list models.
---

# List Models

Programmatically list models.

**Import:** `import { ListModelsUseCase } from "webiny/api/cms/model";`

## Types

```typescript
import { ListModelsUseCase } from "webiny/api/cms/model";

// ListModelsUseCase.Interface
type Interface = IListModelsUseCase;

// ListModelsUseCase.Error
type Error = UseCaseError;

// ListModelsUseCase.Return
type Return = Promise<Result<CmsModel[], UseCaseError>>;

// ListModelsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListModelsUseCase } from "webiny/api/cms/model";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-models.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
