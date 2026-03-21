---
name: api-get-file
category: api/file-manager
type: UseCase
class: GetFileUseCase
import: webiny/api/file-manager/file
description: >
  Programmatically get file.
---

# Get File

Programmatically get file.

**Import:** `import { GetFileUseCase } from "webiny/api/file-manager/file";`

## Types

```typescript
import { GetFileUseCase } from "webiny/api/file-manager/file";

// GetFileUseCase.Interface
type Interface = IGetFileUseCase;

// GetFileUseCase.Error
type Error = UseCaseError;

// GetFileUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetFileUseCase } from "webiny/api/file-manager/file";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-file.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
