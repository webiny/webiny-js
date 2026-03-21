---
name: api-list-files
category: api/file-manager
type: UseCase
class: ListFilesUseCase
import: webiny/api/file-manager/file
description: >
  Programmatically list files.
---

# List Files

Programmatically list files.

**Import:** `import { ListFilesUseCase } from "webiny/api/file-manager/file";`

## Types

```typescript
import { ListFilesUseCase } from "webiny/api/file-manager/file";

// ListFilesUseCase.Interface
type Interface = IListFilesUseCase;

// ListFilesUseCase.Error
type Error = UseCaseError;

// ListFilesUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListFilesUseCase } from "webiny/api/file-manager/file";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-files.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
