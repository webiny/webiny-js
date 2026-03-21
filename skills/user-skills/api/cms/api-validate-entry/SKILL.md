---
name: api-validate-entry
category: api/cms
type: UseCase
class: ValidateEntryUseCase
import: webiny/api/cms/entry
description: >
  Programmatically validate entry.
---

# Validate Entry

Programmatically validate entry.

**Import:** `import { ValidateEntryUseCase } from "webiny/api/cms/entry";`

## Types

```typescript
import { ValidateEntryUseCase } from "webiny/api/cms/entry";

// ValidateEntryUseCase.Interface
type Interface = IValidateEntryUseCase;

// ValidateEntryUseCase.Input
type Input = UpdateCmsEntryInput<T>;

// ValidateEntryUseCase.Error
type Error = UseCaseError;

// ValidateEntryUseCase.Return
type Return = IValidateEntryUseCaseExecuteResult;

// ValidateEntryUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ValidateEntryUseCase } from "webiny/api/cms/entry";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/validate-entry.ts"} />
```

## Notes

- Handler fires for ALL content models — always filter by `event.payload.model.modelId`
- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
