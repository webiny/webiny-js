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
2. Read the source file to get the exact interface and types
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Name:** `CreateFlpUseCase`
**Import:** `webiny/api/aco/flp`
**Source:** `@webiny/api-aco/features/flp/CreateFlp/abstractions.ts`
**Description:** Create a folder-level permission.

---
**Name:** `CreateFolderRepository`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts`
**Description:** Persist a newly created folder.

---
**Name:** `CreateFolderUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts`
**Description:** Create a new folder.

---
**Name:** `DeleteFlpUseCase`
**Import:** `webiny/api/aco/flp`
**Source:** `@webiny/api-aco/features/flp/DeleteFlp/abstractions.ts`
**Description:** Delete a folder-level permission.

---
**Name:** `DeleteFolderRepository`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts`
**Description:** Persist folder deletion.

---
**Name:** `DeleteFolderUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts`
**Description:** Delete a folder.

---
**Name:** `EnsureFolderIsEmpty`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/EnsureFolderIsEmpty/abstractions.ts`
**Description:** Verify a folder has no children before deletion.

---
**Name:** `FilterStorageOperations`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/shared/abstractions.ts`
**Description:** Storage operations for folder filtering.

---
**Name:** `FolderAfterCreateEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts`
**Description:** Hook into folder lifecycle after a folder is created.

---
**Name:** `FolderAfterDeleteEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts`
**Description:** Hook into folder lifecycle after a folder is deleted.

---
**Name:** `FolderAfterGetEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetFolder/abstractions.ts`
**Description:** Hook into folder lifecycle after a folder is retrieved.

---
**Name:** `FolderAfterUpdateEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts`
**Description:** Hook into folder lifecycle after a folder is updated.

---
**Name:** `FolderBeforeCreateEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts`
**Description:** Hook into folder lifecycle before a folder is created.

---
**Name:** `FolderBeforeDeleteEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts`
**Description:** Hook into folder lifecycle before a folder is deleted.

---
**Name:** `FolderBeforeGetEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetFolder/abstractions.ts`
**Description:** Hook into folder lifecycle before a folder is retrieved.

---
**Name:** `FolderBeforeUpdateEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts`
**Description:** Hook into folder lifecycle before a folder is updated.

---
**Name:** `FolderLevelPermissions`
**Import:** `webiny/api/aco/flp`
**Source:** `@webiny/api-aco/features/flp/FolderLevelPermissions/abstractions.ts`
**Description:** Manage folder-level access control.

---
**Name:** `GetAncestorsRepository`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetAncestors/abstractions.ts`
**Description:** Fetch ancestor folders from storage.

---
**Name:** `GetAncestorsUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetAncestors/abstractions.ts`
**Description:** Retrieve ancestor folders in the hierarchy.

---
**Name:** `GetFlpUseCase`
**Import:** `webiny/api/aco/flp`
**Source:** `@webiny/api-aco/features/flp/GetFlp/abstractions.ts`
**Description:** Retrieve a folder-level permission.

---
**Name:** `GetFolderHierarchyRepository`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetFolderHierarchy/abstractions.ts`
**Description:** Fetch folder hierarchy from storage.

---
**Name:** `GetFolderHierarchyUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetFolderHierarchy/abstractions.ts`
**Description:** Retrieve the full folder hierarchy.

---
**Name:** `GetFolderUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetFolder/abstractions.ts`
**Description:** Retrieve a folder.

---
**Name:** `ListFlpsUseCase`
**Import:** `webiny/api/aco/flp`
**Source:** `@webiny/api-aco/features/flp/ListFlps/abstractions.ts`
**Description:** List folder-level permissions.

---
**Name:** `ListFolderLevelPermissionsTargetsUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/ListFolderLevelPermissionsTargets/abstractions.ts`
**Description:** List targets for folder-level permissions.

---
**Name:** `ListFoldersRepository`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/ListFolders/abstractions.ts`
**Description:** Fetch folders from storage.

---
**Name:** `ListFoldersUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/ListFolders/abstractions.ts`
**Description:** List folders with filtering.

---
**Name:** `UpdateFlpUseCase`
**Import:** `webiny/api/aco/flp`
**Source:** `@webiny/api-aco/features/flp/UpdateFlp/abstractions.ts`
**Description:** Update a folder-level permission.

---
**Name:** `UpdateFolderRepository`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts`
**Description:** Persist folder updates.

---
**Name:** `UpdateFolderUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts`
**Description:** Update a folder.

---
