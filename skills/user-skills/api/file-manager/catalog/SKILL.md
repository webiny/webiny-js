---
name: webiny-api-file-manager-catalog
context: webiny-api
description: >
  API — File Manager — 28 abstractions.
  File event handlers and use cases.
---

# API — File Manager

File event handlers and use cases.

## How to Use

1. Find the abstraction you need in the table below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

| Class | Import | Source |
|-------|--------|--------|
| `CreateFileRepository` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/CreateFile/abstractions.ts` |
| `CreateFilesInBatchRepository` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/CreateFilesInBatch/abstractions.ts` |
| `CreateFilesInBatchUseCase` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/CreateFilesInBatch/abstractions.ts` |
| `CreateFileUseCase` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/CreateFile/abstractions.ts` |
| `DeleteFileRepository` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/DeleteFile/abstractions.ts` |
| `DeleteFileUseCase` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/DeleteFile/abstractions.ts` |
| `FileAfterBatchCreateEventHandler` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/CreateFilesInBatch/events.ts` |
| `FileAfterCreateEventHandler` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/CreateFile/events.ts` |
| `FileAfterDeleteEventHandler` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/DeleteFile/events.ts` |
| `FileAfterUpdateEventHandler` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/UpdateFile/events.ts` |
| `FileBeforeBatchCreateEventHandler` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/CreateFilesInBatch/events.ts` |
| `FileBeforeCreateEventHandler` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/CreateFile/events.ts` |
| `FileBeforeDeleteEventHandler` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/DeleteFile/events.ts` |
| `FileBeforeUpdateEventHandler` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/UpdateFile/events.ts` |
| `FileUrlGenerator` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/FileUrlGenerator/abstractions.ts` |
| `FmPermissions` | `webiny/api/file-manager/permissions` | `@webiny/api-file-manager/features/shared/abstractions.ts` |
| `GetFileRepository` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/GetFile/abstractions.ts` |
| `GetFileUseCase` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/GetFile/abstractions.ts` |
| `GetSettingsUseCase` | `webiny/api/file-manager/settings` | `@webiny/api-file-manager/features/settings/GetSettings/abstractions.ts` |
| `ListFilesRepository` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/ListFiles/abstractions.ts` |
| `ListFilesUseCase` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/ListFiles/abstractions.ts` |
| `ListTagsRepository` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/ListTags/abstractions.ts` |
| `ListTagsUseCase` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/ListTags/abstractions.ts` |
| `SettingsAfterUpdateEventHandler` | `webiny/api/file-manager/settings` | `@webiny/api-file-manager/features/settings/UpdateSettings/events.ts` |
| `SettingsBeforeUpdateEventHandler` | `webiny/api/file-manager/settings` | `@webiny/api-file-manager/features/settings/UpdateSettings/events.ts` |
| `UpdateFileRepository` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/UpdateFile/abstractions.ts` |
| `UpdateFileUseCase` | `webiny/api/file-manager/file` | `@webiny/api-file-manager/features/file/UpdateFile/abstractions.ts` |
| `UpdateSettingsUseCase` | `webiny/api/file-manager/settings` | `@webiny/api-file-manager/features/settings/UpdateSettings/abstractions.ts` |
