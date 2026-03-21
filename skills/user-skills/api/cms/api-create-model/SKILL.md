---
name: api-create-model
category: api/cms
type: UseCase
class: CreateModelUseCase
import: webiny/api/cms/model
description: >
  Programmatically create model.
---

# Create Model

Programmatically create model.

**Import:** `import { CreateModelUseCase } from "webiny/api/cms/model";`

## Types

```typescript
import { CreateModelUseCase } from "webiny/api/cms/model";

// CreateModelUseCase.Interface
type Interface = ICreateModelUseCase;

// CreateModelUseCase.Input
type Input = CmsModelCreateInput;

// CreateModelUseCase.Error
type Error = UseCaseError;

// CreateModelUseCase.Return
type Return = Promise<Result<CmsModel, UseCaseError>>;

// CreateModelUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateModelUseCase } from "webiny/api/cms/model";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-model.ts"} />
```

## Notes

- Model handlers affect all content models — use with caution
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
