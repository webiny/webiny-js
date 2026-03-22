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

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Class:** `CreateFileRepository`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/CreateFile/abstractions.ts`
**Description:** Persist a newly created file.

---
**Class:** `CreateFilesInBatchRepository`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/CreateFilesInBatch/abstractions.ts`
**Description:** Persist multiple files created in batch.

---
**Class:** `CreateFilesInBatchUseCase`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/CreateFilesInBatch/abstractions.ts`
**Description:** Upload and create multiple files in batch.

---
**Class:** `CreateFileUseCase`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/CreateFile/abstractions.ts`
**Description:** Upload and create a new file.

---
**Class:** `DeleteFileRepository`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/DeleteFile/abstractions.ts`
**Description:** Persist file deletion.

---
**Class:** `DeleteFileUseCase`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/DeleteFile/abstractions.ts`
**Description:** Delete a file.

---
**Class:** `FileAfterBatchCreateEventHandler`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/CreateFilesInBatch/events.ts`
**Description:** Hook into file lifecycle after files are created in batch.

---
**Class:** `FileAfterCreateEventHandler`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/CreateFile/events.ts`
**Description:** Hook into file lifecycle after a file is created.

---
**Class:** `FileAfterDeleteEventHandler`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/DeleteFile/events.ts`
**Description:** Hook into file lifecycle after a file is deleted.

---
**Class:** `FileAfterUpdateEventHandler`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/UpdateFile/events.ts`
**Description:** Hook into file lifecycle after a file is updated.

---
**Class:** `FileBeforeBatchCreateEventHandler`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/CreateFilesInBatch/events.ts`
**Description:** Hook into file lifecycle before files are created in batch.

---
**Class:** `FileBeforeCreateEventHandler`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/CreateFile/events.ts`
**Description:** Hook into file lifecycle before a file is created.

---
**Class:** `FileBeforeDeleteEventHandler`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/DeleteFile/events.ts`
**Description:** Hook into file lifecycle before a file is deleted.

---
**Class:** `FileBeforeUpdateEventHandler`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/UpdateFile/events.ts`
**Description:** Hook into file lifecycle before a file is updated.

---
**Class:** `FileUrlGenerator`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/FileUrlGenerator/abstractions.ts`
**Description:** Generate URLs for uploaded files.

---
**Class:** `FmPermissions`
**Import:** `webiny/api/file-manager/permissions`
**Source:** `@webiny/api-file-manager/features/shared/abstractions.ts`

---
**Class:** `GetFileRepository`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/GetFile/abstractions.ts`
**Description:** Fetch a file from storage.

---
**Class:** `GetFileUseCase`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/GetFile/abstractions.ts`
**Description:** Retrieve a file by ID.

---
**Class:** `GetSettingsUseCase`
**Import:** `webiny/api/file-manager/settings`
**Source:** `@webiny/api-file-manager/features/settings/GetSettings/abstractions.ts`
**Description:** Retrieve file manager settings.

---
**Class:** `ListFilesRepository`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/ListFiles/abstractions.ts`
**Description:** Fetch files from storage with filtering.

---
**Class:** `ListFilesUseCase`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/ListFiles/abstractions.ts`
**Description:** List files with filtering and pagination.

---
**Class:** `ListTagsRepository`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/ListTags/abstractions.ts`
**Description:** Fetch file tags from storage.

---
**Class:** `ListTagsUseCase`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/ListTags/abstractions.ts`
**Description:** List all file tags.

---
**Class:** `SettingsAfterUpdateEventHandler`
**Import:** `webiny/api/file-manager/settings`
**Source:** `@webiny/api-file-manager/features/settings/UpdateSettings/events.ts`
**Description:** Hook into settings lifecycle after settings are updated.

---
**Class:** `SettingsBeforeUpdateEventHandler`
**Import:** `webiny/api/file-manager/settings`
**Source:** `@webiny/api-file-manager/features/settings/UpdateSettings/events.ts`
**Description:** Hook into settings lifecycle before settings are updated.

---
**Class:** `UpdateFileRepository`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/UpdateFile/abstractions.ts`
**Description:** Persist file metadata updates.

---
**Class:** `UpdateFileUseCase`
**Import:** `webiny/api/file-manager/file`
**Source:** `@webiny/api-file-manager/features/file/UpdateFile/abstractions.ts`
**Description:** Update file metadata.

---
**Class:** `UpdateSettingsUseCase`
**Import:** `webiny/api/file-manager/settings`
**Source:** `@webiny/api-file-manager/features/settings/UpdateSettings/abstractions.ts`
**Description:** Update file manager settings.

---
