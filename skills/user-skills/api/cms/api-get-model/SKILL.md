---
name: api-get-model
category: api/cms
type: UseCase
class: GetModelUseCase
import: webiny/api/cms/model
description: >
  Programmatically get model.
---

# Get Model

Programmatically get model.

**Import:** `import { GetModelUseCase } from "webiny/api/cms/model";`

## Types

```typescript
import { GetModelUseCase } from "webiny/api/cms/model";

// GetModelUseCase.Interface
type Interface = IGetModelUseCase;

// GetModelUseCase.Error
type Error = UseCaseError;

// GetModelUseCase.Return
type Return = Promise<Result<CmsModel, UseCaseError>>;

// GetModelUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetModelUseCase } from "webiny/api/cms/model";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-model.ts"} />
```

## Notes

- Model handlers affect all content models — use with caution
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
