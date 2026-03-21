---
name: api-delete-folder
category: api/aco
type: UseCase
class: DeleteFolderUseCase
import: webiny/api/aco/folder
description: >
  Programmatically delete folder.
---

# Delete Folder

Programmatically delete folder.

**Import:** `import { DeleteFolderUseCase } from "webiny/api/aco/folder";`

## Types

```typescript
import { DeleteFolderUseCase } from "webiny/api/aco/folder";

// DeleteFolderUseCase.Interface
type Interface = IDeleteFolderUseCase;

// DeleteFolderUseCase.Error
type Error = UseCaseError;

// DeleteFolderUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { DeleteFolderUseCase } from "webiny/api/aco/folder";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/delete-folder.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
