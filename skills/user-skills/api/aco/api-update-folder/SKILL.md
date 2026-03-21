---
name: api-update-folder
category: api/aco
type: UseCase
class: UpdateFolderUseCase
import: webiny/api/aco/folder
description: >
  Programmatically update folder.
---

# Update Folder

Programmatically update folder.

**Import:** `import { UpdateFolderUseCase } from "webiny/api/aco/folder";`

## Types

```typescript
import { UpdateFolderUseCase } from "webiny/api/aco/folder";

// UpdateFolderUseCase.Interface
type Interface = IUpdateFolderUseCase;

// UpdateFolderUseCase.Error
type Error = UseCaseError;

// UpdateFolderUseCase.Return
type Return = Promise<Result<Folder, UseCaseError>>;

// UpdateFolderUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { UpdateFolderUseCase } from "webiny/api/aco/folder";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/update-folder.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
