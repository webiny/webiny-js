---
name: api-get-folder-hierarchy
category: api/aco
type: UseCase
class: GetFolderHierarchyUseCase
import: webiny/api/aco/folder
description: >
  Programmatically get folderhierarchy.
---

# Get Folder Hierarchy

Programmatically get folderhierarchy.

**Import:** `import { GetFolderHierarchyUseCase } from "webiny/api/aco/folder";`

## Types

```typescript
import { GetFolderHierarchyUseCase } from "webiny/api/aco/folder";

// GetFolderHierarchyUseCase.Interface
type Interface = IGetFolderHierarchyUseCase;

// GetFolderHierarchyUseCase.Error
type Error = UseCaseError;

// GetFolderHierarchyUseCase.Return
type Return = Promise<Result<GetFolderHierarchyResponse, UseCaseError>>;

// GetFolderHierarchyUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { GetFolderHierarchyUseCase } from "webiny/api/aco/folder";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/get-folder-hierarchy.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
