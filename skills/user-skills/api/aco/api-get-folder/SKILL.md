---
name: api-get-folder
category: api/aco
type: UseCase
class: GetFolderUseCase
import: webiny/api/aco/folder
description: >
  Programmatically get folder.
---

# Get Folder

Programmatically get folder.

**Import:** `import { GetFolderUseCase } from "webiny/api/aco/folder";`

## Types

```typescript
import { GetFolderUseCase } from "webiny/api/aco/folder";

// GetFolderUseCase.Interface
type Interface = IGetFolderUseCase;

// GetFolderUseCase.Error
type Error = UseCaseError;

// GetFolderUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetFolderUseCase } from "webiny/api/aco/folder";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-folder.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
