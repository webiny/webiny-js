---
name: api-list-folder-level-permissions-targets
category: api/aco
type: UseCase
class: ListFolderLevelPermissionsTargetsUseCase
import: webiny/api/aco/folder
description: >
  Programmatically list folderlevelpermissionstargets.
---

# List Folder Level Permissions Targets

Programmatically list folderlevelpermissionstargets.

**Import:** `import { ListFolderLevelPermissionsTargetsUseCase } from "webiny/api/aco/folder";`

## Types

```typescript
import { ListFolderLevelPermissionsTargetsUseCase } from "webiny/api/aco/folder";

// ListFolderLevelPermissionsTargetsUseCase.Interface
type Interface = IListFolderLevelPermissionsTargetsUseCase;

// ListFolderLevelPermissionsTargetsUseCase.Return
type Return = Promise<
        Result<[FolderLevelPermissionsTarget[], FolderLevelPermissionsTargetListMeta]>
    >;

// ListFolderLevelPermissionsTargetsUseCase.createImplementation
function createImplementation(params: {
  implementation: new (...args: any[]) => Interface;
  dependencies: any[];
}): any;
```

## Example

```typescript
import { ListFolderLevelPermissionsTargetsUseCase } from "webiny/api/aco/folder";

<!-- TODO: Generate a realistic example for this use case -->
```

## Registration

```tsx
<Api.Extension src={"@/extensions/list-folder-level-permissions-targets.ts"} />
```

## Notes

- Use cases can be overridden via DI to customize behavior
- Use `Result` return type for error handling — check `.isOk()` / `.isErr()`

## Related Skills

- `dependency-injection` — inject Logger, BuildParams, and other services
