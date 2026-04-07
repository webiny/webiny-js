---
name: webiny-api-aco-catalog
context: webiny-api
description: >
  API — ACO — 30 abstractions.
  Folder event handlers and use cases.
---

# API — ACO

Folder event handlers and use cases.

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Name:** `CreateFlpUseCase`
**Import:** `import { CreateFlpUseCase } from "webiny/api/aco/flp"`
**Source:** `@webiny/api-aco/features/flp/CreateFlp/abstractions.ts`
**Description:** Create a folder-level permission.

---
**Name:** `CreateFolderRepository`
**Import:** `import { CreateFolderRepository } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts`
**Description:** Persist a newly created folder.

---
**Name:** `CreateFolderUseCase`
**Import:** `import { CreateFolderUseCase } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts`
**Description:** Create a new folder.

---
**Name:** `DeleteFlpUseCase`
**Import:** `import { DeleteFlpUseCase } from "webiny/api/aco/flp"`
**Source:** `@webiny/api-aco/features/flp/DeleteFlp/abstractions.ts`
**Description:** Delete a folder-level permission.

---
**Name:** `DeleteFolderRepository`
**Import:** `import { DeleteFolderRepository } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts`
**Description:** Persist folder deletion.

---
**Name:** `DeleteFolderUseCase`
**Import:** `import { DeleteFolderUseCase } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts`
**Description:** Delete a folder.

---
**Name:** `EnsureFolderIsEmpty`
**Import:** `import { EnsureFolderIsEmpty } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/EnsureFolderIsEmpty/abstractions.ts`
**Description:** Verify a folder has no children before deletion.

---
**Name:** `FilterStorageOperations`
**Import:** `import { FilterStorageOperations } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/shared/abstractions.ts`
**Description:** Storage operations for folder filtering.

---
**Name:** `FolderAfterCreateEventHandler`
**Import:** `import { FolderAfterCreateEventHandler } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts`
**Description:** Hook into folder lifecycle after a folder is created.

---
**Name:** `FolderAfterDeleteEventHandler`
**Import:** `import { FolderAfterDeleteEventHandler } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts`
**Description:** Hook into folder lifecycle after a folder is deleted.

---
**Name:** `FolderAfterGetEventHandler`
**Import:** `import { FolderAfterGetEventHandler } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/GetFolder/abstractions.ts`
**Description:** Hook into folder lifecycle after a folder is retrieved.

---
**Name:** `FolderAfterUpdateEventHandler`
**Import:** `import { FolderAfterUpdateEventHandler } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts`
**Description:** Hook into folder lifecycle after a folder is updated.

---
**Name:** `FolderBeforeCreateEventHandler`
**Import:** `import { FolderBeforeCreateEventHandler } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts`
**Description:** Hook into folder lifecycle before a folder is created.

---
**Name:** `FolderBeforeDeleteEventHandler`
**Import:** `import { FolderBeforeDeleteEventHandler } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts`
**Description:** Hook into folder lifecycle before a folder is deleted.

---
**Name:** `FolderBeforeGetEventHandler`
**Import:** `import { FolderBeforeGetEventHandler } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/GetFolder/abstractions.ts`
**Description:** Hook into folder lifecycle before a folder is retrieved.

---
**Name:** `FolderBeforeUpdateEventHandler`
**Import:** `import { FolderBeforeUpdateEventHandler } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts`
**Description:** Hook into folder lifecycle before a folder is updated.

---
**Name:** `FolderLevelPermissions`
**Import:** `import { FolderLevelPermissions } from "webiny/api/aco/flp"`
**Source:** `@webiny/api-aco/features/flp/FolderLevelPermissions/abstractions.ts`
**Description:** Manage folder-level access control.

---
**Name:** `GetAncestorsRepository`
**Import:** `import { GetAncestorsRepository } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/GetAncestors/abstractions.ts`
**Description:** Fetch ancestor folders from storage.

---
**Name:** `GetAncestorsUseCase`
**Import:** `import { GetAncestorsUseCase } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/GetAncestors/abstractions.ts`
**Description:** Retrieve ancestor folders in the hierarchy.

---
**Name:** `GetFlpUseCase`
**Import:** `import { GetFlpUseCase } from "webiny/api/aco/flp"`
**Source:** `@webiny/api-aco/features/flp/GetFlp/abstractions.ts`
**Description:** Retrieve a folder-level permission.

---
**Name:** `GetFolderHierarchyRepository`
**Import:** `import { GetFolderHierarchyRepository } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/GetFolderHierarchy/abstractions.ts`
**Description:** Fetch folder hierarchy from storage.

---
**Name:** `GetFolderHierarchyUseCase`
**Import:** `import { GetFolderHierarchyUseCase } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/GetFolderHierarchy/abstractions.ts`
**Description:** Retrieve the full folder hierarchy.

---
**Name:** `GetFolderUseCase`
**Import:** `import { GetFolderUseCase } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/GetFolder/abstractions.ts`
**Description:** Retrieve a folder.

---
**Name:** `ListFlpsUseCase`
**Import:** `import { ListFlpsUseCase } from "webiny/api/aco/flp"`
**Source:** `@webiny/api-aco/features/flp/ListFlps/abstractions.ts`
**Description:** List folder-level permissions.

---
**Name:** `ListFolderLevelPermissionsTargetsUseCase`
**Import:** `import { ListFolderLevelPermissionsTargetsUseCase } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/ListFolderLevelPermissionsTargets/abstractions.ts`
**Description:** List targets for folder-level permissions.

---
**Name:** `ListFoldersRepository`
**Import:** `import { ListFoldersRepository } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/ListFolders/abstractions.ts`
**Description:** Fetch folders from storage.

---
**Name:** `ListFoldersUseCase`
**Import:** `import { ListFoldersUseCase } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/ListFolders/abstractions.ts`
**Description:** List folders with filtering.

---
**Name:** `UpdateFlpUseCase`
**Import:** `import { UpdateFlpUseCase } from "webiny/api/aco/flp"`
**Source:** `@webiny/api-aco/features/flp/UpdateFlp/abstractions.ts`
**Description:** Update a folder-level permission.

---
**Name:** `UpdateFolderRepository`
**Import:** `import { UpdateFolderRepository } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts`
**Description:** Persist folder updates.

---
**Name:** `UpdateFolderUseCase`
**Import:** `import { UpdateFolderUseCase } from "webiny/api/aco/folder"`
**Source:** `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts`
**Description:** Update a folder.

---
