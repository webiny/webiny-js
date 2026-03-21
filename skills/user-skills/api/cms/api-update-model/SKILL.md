---
name: api-update-model
category: api/cms
type: UseCase
class: UpdateModelUseCase
import: webiny/api/cms/model
description: >
  Programmatically update model.
---

# Update Model

Programmatically update model.

**Import:** `import { UpdateModelUseCase } from "webiny/api/cms/model";`

## Types

```typescript
import { UpdateModelUseCase } from "webiny/api/cms/model";

// UpdateModelUseCase.Interface
type Interface = IUpdateModelUseCase;

// UpdateModelUseCase.Input
type Input = CmsModelUpdateInput;

// UpdateModelUseCase.Error
type Error = UseCaseError;

// UpdateModelUseCase.Return
type Return = Promise<Result<CmsModel, UseCaseError>>;

// UpdateModelUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdateModelUseCase } from "webiny/api/cms/model";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-model.ts"} />
```

## Notes

- Model handlers affect all content models — use with caution
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
