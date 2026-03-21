---
name: api-delete-file
category: api/file-manager
type: UseCase
class: DeleteFileUseCase
import: webiny/api/file-manager/file
description: >
  Programmatically delete file.
---

# Delete File

Programmatically delete file.

**Import:** `import { DeleteFileUseCase } from "webiny/api/file-manager/file";`

## Types

```typescript
import { DeleteFileUseCase } from "webiny/api/file-manager/file";

// DeleteFileUseCase.Interface
type Interface = IDeleteFileUseCase;

// DeleteFileUseCase.Error
type Error = UseCaseError;

// DeleteFileUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeleteFileUseCase } from "webiny/api/file-manager/file";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-file.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
