---
name: api-list-folders
category: api/aco
type: UseCase
class: ListFoldersUseCase
import: webiny/api/aco/folder
description: >
  Programmatically list folders.
---

# List Folders

Programmatically list folders.

**Import:** `import { ListFoldersUseCase } from "webiny/api/aco/folder";`

## Types

```typescript
import { ListFoldersUseCase } from "webiny/api/aco/folder";

// ListFoldersUseCase.Interface
type Interface = IListFoldersUseCase;

// ListFoldersUseCase.Error
type Error = UseCaseError;

// ListFoldersUseCase.Return
type Return = Promise<Result<IListFoldersResult, UseCaseError>>;

// ListFoldersUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListFoldersUseCase } from "webiny/api/aco/folder";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-folders.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
