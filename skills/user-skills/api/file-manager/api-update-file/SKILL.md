---
name: api-update-file
category: api/file-manager
type: UseCase
class: UpdateFileUseCase
import: webiny/api/file-manager/file
description: >
  Programmatically update file.
---

# Update File

Programmatically update file.

**Import:** `import { UpdateFileUseCase } from "webiny/api/file-manager/file";`

## Types

```typescript
import { UpdateFileUseCase } from "webiny/api/file-manager/file";

// UpdateFileUseCase.Interface
type Interface = IUpdateFileUseCase;

// UpdateFileUseCase.Error
type Error = UseCaseError;

// UpdateFileUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdateFileUseCase } from "webiny/api/file-manager/file";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-file.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
