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

1. Find the abstraction you need in the table below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

| Class | Import | Source |
|-------|--------|--------|
| `CreateFlpUseCase` | `webiny/api/aco/flp` | `@webiny/api-aco/features/flp/CreateFlp/abstractions.ts` |
| `CreateFolderRepository` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts` |
| `CreateFolderUseCase` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts` |
| `DeleteFlpUseCase` | `webiny/api/aco/flp` | `@webiny/api-aco/features/flp/DeleteFlp/abstractions.ts` |
| `DeleteFolderRepository` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts` |
| `DeleteFolderUseCase` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts` |
| `EnsureFolderIsEmpty` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/EnsureFolderIsEmpty/abstractions.ts` |
| `FilterStorageOperations` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/shared/abstractions.ts` |
| `FolderAfterCreateEventHandler` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts` |
| `FolderAfterDeleteEventHandler` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts` |
| `FolderAfterGetEventHandler` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/GetFolder/abstractions.ts` |
| `FolderAfterUpdateEventHandler` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts` |
| `FolderBeforeCreateEventHandler` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/CreateFolder/abstractions.ts` |
| `FolderBeforeDeleteEventHandler` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/DeleteFolder/abstractions.ts` |
| `FolderBeforeGetEventHandler` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/GetFolder/abstractions.ts` |
| `FolderBeforeUpdateEventHandler` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts` |
| `FolderLevelPermissions` | `webiny/api/aco/flp` | `@webiny/api-aco/features/flp/FolderLevelPermissions/abstractions.ts` |
| `GetAncestorsRepository` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/GetAncestors/abstractions.ts` |
| `GetAncestorsUseCase` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/GetAncestors/abstractions.ts` |
| `GetFlpUseCase` | `webiny/api/aco/flp` | `@webiny/api-aco/features/flp/GetFlp/abstractions.ts` |
| `GetFolderHierarchyRepository` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/GetFolderHierarchy/abstractions.ts` |
| `GetFolderHierarchyUseCase` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/GetFolderHierarchy/abstractions.ts` |
| `GetFolderUseCase` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/GetFolder/abstractions.ts` |
| `ListFlpsUseCase` | `webiny/api/aco/flp` | `@webiny/api-aco/features/flp/ListFlps/abstractions.ts` |
| `ListFolderLevelPermissionsTargetsUseCase` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/ListFolderLevelPermissionsTargets/abstractions.ts` |
| `ListFoldersRepository` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/ListFolders/abstractions.ts` |
| `ListFoldersUseCase` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/ListFolders/abstractions.ts` |
| `UpdateFlpUseCase` | `webiny/api/aco/flp` | `@webiny/api-aco/features/flp/UpdateFlp/abstractions.ts` |
| `UpdateFolderRepository` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts` |
| `UpdateFolderUseCase` | `webiny/api/aco/folder` | `@webiny/api-aco/features/folder/UpdateFolder/abstractions.ts` |
