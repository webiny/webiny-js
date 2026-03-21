---
name: api-create-model-from
category: api/cms
type: UseCase
class: CreateModelFromUseCase
import: webiny/api/cms/model
description: >
  Programmatically create modelfrom.
---

# Create Model From

Programmatically create modelfrom.

**Import:** `import { CreateModelFromUseCase } from "webiny/api/cms/model";`

## Types

```typescript
import { CreateModelFromUseCase } from "webiny/api/cms/model";

// CreateModelFromUseCase.Interface
type Interface = ICreateModelFromUseCase;

// CreateModelFromUseCase.Input
type Input = CmsModelCreateFromInput;

// CreateModelFromUseCase.Error
type Error = UseCaseError;

// CreateModelFromUseCase.Return
type Return = Promise<Result<CmsModel, UseCaseError>>;

// CreateModelFromUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateModelFromUseCase } from "webiny/api/cms/model";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-model-from.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
