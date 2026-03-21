---
name: api-delete-model
category: api/cms
type: UseCase
class: DeleteModelUseCase
import: webiny/api/cms/model
description: >
  Programmatically delete model.
---

# Delete Model

Programmatically delete model.

**Import:** `import { DeleteModelUseCase } from "webiny/api/cms/model";`

## Types

```typescript
import { DeleteModelUseCase } from "webiny/api/cms/model";

// DeleteModelUseCase.Interface
type Interface = IDeleteModelUseCase;

// DeleteModelUseCase.Error
type Error = UseCaseError;

// DeleteModelUseCase.Return
type Return = Promise<Result<void, UseCaseError>>;

// DeleteModelUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeleteModelUseCase } from "webiny/api/cms/model";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-model.ts"} />
```

## Notes

- Model handlers affect all content models — use with caution
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
