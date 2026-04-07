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
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Name:** `CreateFileRepository`
**Import:** `import { CreateFileRepository } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/CreateFile/abstractions.ts`
**Description:** Persist a newly created file.

---
**Name:** `CreateFilesInBatchRepository`
**Import:** `import { CreateFilesInBatchRepository } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/CreateFilesInBatch/abstractions.ts`
**Description:** Persist multiple files created in batch.

---
**Name:** `CreateFilesInBatchUseCase`
**Import:** `import { CreateFilesInBatchUseCase } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/CreateFilesInBatch/abstractions.ts`
**Description:** Upload and create multiple files in batch.

---
**Name:** `CreateFileUseCase`
**Import:** `import { CreateFileUseCase } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/CreateFile/abstractions.ts`
**Description:** Upload and create a new file.

---
**Name:** `DeleteFileRepository`
**Import:** `import { DeleteFileRepository } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/DeleteFile/abstractions.ts`
**Description:** Persist file deletion.

---
**Name:** `DeleteFileUseCase`
**Import:** `import { DeleteFileUseCase } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/DeleteFile/abstractions.ts`
**Description:** Delete a file.

---
**Name:** `FileAfterBatchCreateEventHandler`
**Import:** `import { FileAfterBatchCreateEventHandler } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/CreateFilesInBatch/events.ts`
**Description:** Hook into file lifecycle after files are created in batch.

---
**Name:** `FileAfterCreateEventHandler`
**Import:** `import { FileAfterCreateEventHandler } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/CreateFile/events.ts`
**Description:** Hook into file lifecycle after a file is created.

---
**Name:** `FileAfterDeleteEventHandler`
**Import:** `import { FileAfterDeleteEventHandler } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/DeleteFile/events.ts`
**Description:** Hook into file lifecycle after a file is deleted.

---
**Name:** `FileAfterUpdateEventHandler`
**Import:** `import { FileAfterUpdateEventHandler } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/UpdateFile/events.ts`
**Description:** Hook into file lifecycle after a file is updated.

---
**Name:** `FileBeforeBatchCreateEventHandler`
**Import:** `import { FileBeforeBatchCreateEventHandler } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/CreateFilesInBatch/events.ts`
**Description:** Hook into file lifecycle before files are created in batch.

---
**Name:** `FileBeforeCreateEventHandler`
**Import:** `import { FileBeforeCreateEventHandler } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/CreateFile/events.ts`
**Description:** Hook into file lifecycle before a file is created.

---
**Name:** `FileBeforeDeleteEventHandler`
**Import:** `import { FileBeforeDeleteEventHandler } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/DeleteFile/events.ts`
**Description:** Hook into file lifecycle before a file is deleted.

---
**Name:** `FileBeforeUpdateEventHandler`
**Import:** `import { FileBeforeUpdateEventHandler } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/UpdateFile/events.ts`
**Description:** Hook into file lifecycle before a file is updated.

---
**Name:** `FileUrlGenerator`
**Import:** `import { FileUrlGenerator } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/FileUrlGenerator/abstractions.ts`
**Description:** Generate URLs for uploaded files.

---
**Name:** `FmPermissions`
**Import:** `import { FmPermissions } from "webiny/api/file-manager/permissions"`
**Source:** `@webiny/api-file-manager/features/shared/abstractions.ts`

---
**Name:** `GetFileRepository`
**Import:** `import { GetFileRepository } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/GetFile/abstractions.ts`
**Description:** Fetch a file from storage.

---
**Name:** `GetFileUseCase`
**Import:** `import { GetFileUseCase } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/GetFile/abstractions.ts`
**Description:** Retrieve a file by ID.

---
**Name:** `GetSettingsUseCase`
**Import:** `import { GetSettingsUseCase } from "webiny/api/file-manager/settings"`
**Source:** `@webiny/api-file-manager/features/settings/GetSettings/abstractions.ts`
**Description:** Retrieve file manager settings.

---
**Name:** `ListFilesRepository`
**Import:** `import { ListFilesRepository } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/ListFiles/abstractions.ts`
**Description:** Fetch files from storage with filtering.

---
**Name:** `ListFilesUseCase`
**Import:** `import { ListFilesUseCase } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/ListFiles/abstractions.ts`
**Description:** List files with filtering and pagination.

---
**Name:** `ListTagsRepository`
**Import:** `import { ListTagsRepository } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/ListTags/abstractions.ts`
**Description:** Fetch file tags from storage.

---
**Name:** `ListTagsUseCase`
**Import:** `import { ListTagsUseCase } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/ListTags/abstractions.ts`
**Description:** List all file tags.

---
**Name:** `SettingsAfterUpdateEventHandler`
**Import:** `import { SettingsAfterUpdateEventHandler } from "webiny/api/file-manager/settings"`
**Source:** `@webiny/api-file-manager/features/settings/UpdateSettings/events.ts`
**Description:** Hook into settings lifecycle after settings are updated.

---
**Name:** `SettingsBeforeUpdateEventHandler`
**Import:** `import { SettingsBeforeUpdateEventHandler } from "webiny/api/file-manager/settings"`
**Source:** `@webiny/api-file-manager/features/settings/UpdateSettings/events.ts`
**Description:** Hook into settings lifecycle before settings are updated.

---
**Name:** `UpdateFileRepository`
**Import:** `import { UpdateFileRepository } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/UpdateFile/abstractions.ts`
**Description:** Persist file metadata updates.

---
**Name:** `UpdateFileUseCase`
**Import:** `import { UpdateFileUseCase } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/UpdateFile/abstractions.ts`
**Description:** Update file metadata.

---
**Name:** `UpdateSettingsUseCase`
**Import:** `import { UpdateSettingsUseCase } from "webiny/api/file-manager/settings"`
**Source:** `@webiny/api-file-manager/features/settings/UpdateSettings/abstractions.ts`
**Description:** Update file manager settings.

---
