---
name: webiny-api-file-manager-catalog
description: >
  API — File Manager — 48 abstractions.
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

**Name:** `Asset`
**Import:** `import { Asset } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/delivery/AssetDelivery/Asset.ts`

---

**Name:** `AssetAuthorizer`
**Import:** `import { AssetAuthorizer } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/features/assetDelivery/abstractions/AssetAuthorizer.ts`

---

**Name:** `AssetContentsReader`
**Import:** `import { AssetContentsReader } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/features/assetDelivery/abstractions/AssetContentsReader.ts`

---

**Name:** `AssetData`
**Kind:** type
**Import:** `import type { AssetData } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/delivery/AssetDelivery/Asset.ts`

---

**Name:** `AssetFactory`
**Import:** `import { AssetFactory } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/features/assetDelivery/Asset/abstractions.ts`

---

**Name:** `AssetOutputStrategy`
**Import:** `import { AssetOutputStrategy } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/features/assetDelivery/abstractions/AssetOutputStrategy.ts`

---

**Name:** `AssetProcessor`
**Import:** `import { AssetProcessor } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/features/assetDelivery/abstractions/AssetProcessor.ts`

---

**Name:** `AssetReply`
**Import:** `import { AssetReply } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/delivery/AssetDelivery/abstractions/AssetReply.ts`

---

**Name:** `AssetRequest`
**Import:** `import { AssetRequest } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/delivery/AssetDelivery/AssetRequest.ts`

---

**Name:** `AssetRequestFactory`
**Import:** `import { AssetRequestFactory } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/features/assetDelivery/AssetRequest/abstractions.ts`

---

**Name:** `AssetRequestOptions`
**Kind:** type
**Import:** `import type { AssetRequestOptions } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/delivery/AssetDelivery/AssetRequest.ts`

---

**Name:** `AssetRequestResolver`
**Import:** `import { AssetRequestResolver } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/features/assetDelivery/abstractions/AssetRequestResolver.ts`

---

**Name:** `AssetResolver`
**Import:** `import { AssetResolver } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/features/assetDelivery/abstractions/AssetResolver.ts`

---

**Name:** `AssetType`
**Import:** `import { AssetType } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/features/assetDelivery/abstractions/AssetType.ts`

---

**Name:** `createAssetDeliveryPluginLoader`
**Import:** `import { createAssetDeliveryPluginLoader } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/delivery/AssetDelivery/createAssetDeliveryPluginLoader.ts`

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

---

**Name:** `FmPermissions`
**Import:** `import { FmPermissions } from "webiny/api/file-manager/permissions"`
**Source:** `@webiny/api-file-manager/features/shared/abstractions.ts`

---

**Name:** `GetFileByUrlUseCase`
**Import:** `import { GetFileByUrlUseCase } from "webiny/api/file-manager/file"`
**Source:** `@webiny/api-file-manager/features/file/GetFileByUrl/abstractions.ts`

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

**Name:** `IAssetType`
**Kind:** type
**Import:** `import type { IAssetType } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/features/assetDelivery/abstractions/AssetType.ts`

---

**Name:** `IAssetTypeHandler`
**Kind:** type
**Import:** `import type { IAssetTypeHandler } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/features/assetDelivery/abstractions/AssetType.ts`

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

**Name:** `ObjectKey`
**Import:** `import { ObjectKey } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/features/assetDelivery/ObjectKey/abstractions.ts`

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

**Name:** `StreamAssetReply`
**Import:** `import { StreamAssetReply } from "webiny/api/file-manager/assetDelivery"`
**Source:** `@webiny/api-file-manager/features/assetDelivery/StreamAssetReply/abstractions.ts`

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
