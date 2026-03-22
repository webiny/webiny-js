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
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Class:** `CreateFlpUseCase`
**Import:** `webiny/api/aco/flp`
**Source:** `@webiny/api-aco/features/flp/CreateFlp/abstractions.ts`
**Description:** Create a folder-level permission.

---
**Class:** `CreateFolderRepository`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts`
**Description:** Persist a newly created folder.

---
**Class:** `CreateFolderUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts`
**Description:** Create a new folder.

---
**Class:** `DeleteFlpUseCase`
**Import:** `webiny/api/aco/flp`
**Source:** `@webiny/api-aco/features/flp/DeleteFlp/abstractions.ts`
**Description:** Delete a folder-level permission.

---
**Class:** `DeleteFolderRepository`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts`
**Description:** Persist folder deletion.

---
**Class:** `DeleteFolderUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts`
**Description:** Delete a folder.

---
**Class:** `EnsureFolderIsEmpty`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/EnsureFolderIsEmpty/abstractions.ts`
**Description:** Verify a folder has no children before deletion.

---
**Class:** `FilterStorageOperations`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/shared/abstractions.ts`
**Description:** Storage operations for folder filtering.

---
**Class:** `FolderAfterCreateEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts`
**Description:** Hook into folder lifecycle after a folder is created.

---
**Class:** `FolderAfterDeleteEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts`
**Description:** Hook into folder lifecycle after a folder is deleted.

---
**Class:** `FolderAfterGetEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetFolder/abstractions.ts`
**Description:** Hook into folder lifecycle after a folder is retrieved.

---
**Class:** `FolderAfterUpdateEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts`
**Description:** Hook into folder lifecycle after a folder is updated.

---
**Class:** `FolderBeforeCreateEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts`
**Description:** Hook into folder lifecycle before a folder is created.

---
**Class:** `FolderBeforeDeleteEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts`
**Description:** Hook into folder lifecycle before a folder is deleted.

---
**Class:** `FolderBeforeGetEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetFolder/abstractions.ts`
**Description:** Hook into folder lifecycle before a folder is retrieved.

---
**Class:** `FolderBeforeUpdateEventHandler`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts`
**Description:** Hook into folder lifecycle before a folder is updated.

---
**Class:** `FolderLevelPermissions`
**Import:** `webiny/api/aco/flp`
**Source:** `@webiny/api-aco/features/flp/FolderLevelPermissions/abstractions.ts`
**Description:** Manage folder-level access control.

---
**Class:** `GetAncestorsRepository`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetAncestors/abstractions.ts`
**Description:** Fetch ancestor folders from storage.

---
**Class:** `GetAncestorsUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetAncestors/abstractions.ts`
**Description:** Retrieve ancestor folders in the hierarchy.

---
**Class:** `GetFlpUseCase`
**Import:** `webiny/api/aco/flp`
**Source:** `@webiny/api-aco/features/flp/GetFlp/abstractions.ts`
**Description:** Retrieve a folder-level permission.

---
**Class:** `GetFolderHierarchyRepository`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetFolderHierarchy/abstractions.ts`
**Description:** Fetch folder hierarchy from storage.

---
**Class:** `GetFolderHierarchyUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetFolderHierarchy/abstractions.ts`
**Description:** Retrieve the full folder hierarchy.

---
**Class:** `GetFolderUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/GetFolder/abstractions.ts`
**Description:** Retrieve a folder.

---
**Class:** `ListFlpsUseCase`
**Import:** `webiny/api/aco/flp`
**Source:** `@webiny/api-aco/features/flp/ListFlps/abstractions.ts`
**Description:** List folder-level permissions.

---
**Class:** `ListFolderLevelPermissionsTargetsUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/ListFolderLevelPermissionsTargets/abstractions.ts`
**Description:** List targets for folder-level permissions.

---
**Class:** `ListFoldersRepository`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/ListFolders/abstractions.ts`
**Description:** Fetch folders from storage.

---
**Class:** `ListFoldersUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/ListFolders/abstractions.ts`
**Description:** List folders with filtering.

---
**Class:** `UpdateFlpUseCase`
**Import:** `webiny/api/aco/flp`
**Source:** `@webiny/api-aco/features/flp/UpdateFlp/abstractions.ts`
**Description:** Update a folder-level permission.

---
**Class:** `UpdateFolderRepository`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts`
**Description:** Persist folder updates.

---
**Class:** `UpdateFolderUseCase`
**Import:** `webiny/api/aco/folder`
**Source:** `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts`
**Description:** Update a folder.

---
