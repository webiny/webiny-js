---
name: api-create-folder
category: api/aco
type: UseCase
class: CreateFolderUseCase
import: webiny/api/aco/folder
description: >
  Programmatically create folder.
---

# Create Folder

Programmatically create folder.

**Import:** `import { CreateFolderUseCase } from "webiny/api/aco/folder";`

## Types

```typescript
import { CreateFolderUseCase } from "webiny/api/aco/folder";

// CreateFolderUseCase.Interface
type Interface = ICreateFolderUseCase;

// CreateFolderUseCase.Error
type Error = UseCaseError;

// CreateFolderUseCase.Return
type Return = Promise<Result<Folder, UseCaseError>>;

// CreateFolderUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { CreateFolderUseCase } from "webiny/api/aco/folder";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/create-folder.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
