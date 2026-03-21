---
name: api-create-file
category: api/file-manager
type: UseCase
class: CreateFileUseCase
import: webiny/api/file-manager/file
description: >
  Programmatically create file.
---

# Create File

Programmatically create file.

**Import:** `import { CreateFileUseCase } from "webiny/api/file-manager/file";`

## Types

```typescript
import { CreateFileUseCase } from "webiny/api/file-manager/file";

// CreateFileUseCase.Interface
type Interface = ICreateFileUseCase;

// CreateFileUseCase.Error
type Error = UseCaseError;

// CreateFileUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateFileUseCase } from "webiny/api/file-manager/file";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-file.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
