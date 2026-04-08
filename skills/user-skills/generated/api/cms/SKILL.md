---
name: webiny-api-cms-catalog
context: webiny-api
description: >
  API — Headless CMS — 102 abstractions.
  Entry, model, and group event handlers and use cases.
---

# API — Headless CMS

Entry, model, and group event handlers and use cases.

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Name:** `CmsEntry`
**Kind:** type
**Import:** `import type { CmsEntry } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/types/types.ts`
**Description:** A content entry definition for and from the database.

---
**Name:** `CmsEntryValues`
**Kind:** type
**Import:** `import type { CmsEntryValues } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/types/types.ts`
**Description:** A content entry values definition for and from the database.

---
**Name:** `CmsGroup`
**Kind:** type
**Import:** `import type { CmsGroup } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/types/modelGroup.ts`
**Description:** A representation of content model group in the database.

---
**Name:** `CmsModel`
**Kind:** type
**Import:** `import type { CmsModel } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/types/model.ts`
**Description:** Base CMS Model. Should not be exported and used outside of this package.

---
**Name:** `CmsModelField`
**Kind:** type
**Import:** `import type { CmsModelField } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/types/modelField.ts`
**Description:** A definition for content model field. This type exists on the app side as well.

---
**Name:** `CmsModelGroup`
**Kind:** type
**Import:** `import type { CmsModelGroup } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/types/modelGroup.ts`

---
**Name:** `CmsSortMapper`
**Import:** `import { CmsSortMapper } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/sortMapper/abstractions.ts`
**Description:** Map CMS sort parameters to storage queries.

---
**Name:** `CmsWhereMapper`
**Import:** `import { CmsWhereMapper } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/whereMapper/abstractions.ts`
**Description:** Map CMS filter conditions to storage queries.

---
**Name:** `ContentEntryTraverserProvider`
**Import:** `import { ContentEntryTraverserProvider } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/ContentEntryTraverser/index.ts`
**Description:** Traverse the given content entry data using the model's AST.

---
**Name:** `CreateEntryRevisionFromUseCase`
**Import:** `import { CreateEntryRevisionFromUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/abstractions.ts`
**Description:** Create a new entry revision from an existing one.

---
**Name:** `CreateEntryUseCase`
**Import:** `import { CreateEntryUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/CreateEntry/abstractions.ts`
**Description:** Create a new content entry.

---
**Name:** `CreateGroupUseCase`
**Import:** `import { CreateGroupUseCase } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/abstractions.ts`
**Description:** Create a new content model group.

---
**Name:** `CreateModelFromUseCase`
**Import:** `import { CreateModelFromUseCase } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/CreateModelFrom/abstractions.ts`
**Description:** Create a content model by cloning an existing one.

---
**Name:** `CreateModelUseCase`
**Import:** `import { CreateModelUseCase } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/CreateModel/abstractions.ts`
**Description:** Create a new content model.

---
**Name:** `DataFieldBuilder`
**Import:** `import { DataFieldBuilder } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/fields/FieldBuilder.ts`
**Description:** DataFieldBuilder class for data fields that produce CmsModelField instances.
Provides storageId, list, validation, renderer, and other data-field methods.

---
**Name:** `DeleteEntryRevisionUseCase`
**Import:** `import { DeleteEntryRevisionUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/abstractions.ts`
**Description:** Delete a specific entry revision.

---
**Name:** `DeleteEntryUseCase`
**Import:** `import { DeleteEntryUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/abstractions.ts`
**Description:** Delete a content entry.

---
**Name:** `DeleteGroupUseCase`
**Import:** `import { DeleteGroupUseCase } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/abstractions.ts`
**Description:** Delete a content model group.

---
**Name:** `DeleteModelUseCase`
**Import:** `import { DeleteModelUseCase } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/DeleteModel/abstractions.ts`
**Description:** Delete a content model.

---
**Name:** `DeleteMultipleEntriesUseCase`
**Import:** `import { DeleteMultipleEntriesUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/abstractions.ts`
**Description:** Delete multiple content entries in batch.

---
**Name:** `EntryAfterCreateEventHandler`
**Import:** `import { EntryAfterCreateEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is created.

---
**Name:** `EntryAfterDeleteEventHandler`
**Import:** `import { EntryAfterDeleteEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is deleted.

---
**Name:** `EntryAfterDeleteMultipleEventHandler`
**Import:** `import { EntryAfterDeleteMultipleEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/events.ts`
**Description:** Hook into entry lifecycle after multiple entries are deleted.

---
**Name:** `EntryAfterMoveEventHandler`
**Import:** `import { EntryAfterMoveEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/MoveEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is moved.

---
**Name:** `EntryAfterPublishEventHandler`
**Import:** `import { EntryAfterPublishEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is published.

---
**Name:** `EntryAfterRepublishEventHandler`
**Import:** `import { EntryAfterRepublishEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/RepublishEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is republished.

---
**Name:** `EntryAfterRestoreFromBinEventHandler`
**Import:** `import { EntryAfterRestoreFromBinEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.ts`
**Description:** Hook into entry lifecycle after an entry is restored from bin.

---
**Name:** `EntryAfterUnpublishEventHandler`
**Import:** `import { EntryAfterUnpublishEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is unpublished.

---
**Name:** `EntryAfterUpdateEventHandler`
**Import:** `import { EntryAfterUpdateEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is updated.

---
**Name:** `EntryBeforeCreateEventHandler`
**Import:** `import { EntryBeforeCreateEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is created.

---
**Name:** `EntryBeforeDeleteEventHandler`
**Import:** `import { EntryBeforeDeleteEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is deleted.

---
**Name:** `EntryBeforeDeleteMultipleEventHandler`
**Import:** `import { EntryBeforeDeleteMultipleEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/events.ts`
**Description:** Hook into entry lifecycle before multiple entries are deleted.

---
**Name:** `EntryBeforeMoveEventHandler`
**Import:** `import { EntryBeforeMoveEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/MoveEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is moved.

---
**Name:** `EntryBeforePublishEventHandler`
**Import:** `import { EntryBeforePublishEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is published.

---
**Name:** `EntryBeforeRepublishEventHandler`
**Import:** `import { EntryBeforeRepublishEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/RepublishEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is republished.

---
**Name:** `EntryBeforeRestoreFromBinEventHandler`
**Import:** `import { EntryBeforeRestoreFromBinEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.ts`
**Description:** Hook into entry lifecycle before an entry is restored from bin.

---
**Name:** `EntryBeforeUnpublishEventHandler`
**Import:** `import { EntryBeforeUnpublishEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is unpublished.

---
**Name:** `EntryBeforeUpdateEventHandler`
**Import:** `import { EntryBeforeUpdateEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is updated.

---
**Name:** `EntryId`
**Import:** `import { EntryId } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/domain/contentEntry/EntryId.ts`
**Description:** Generate and parse content entry IDs.

---
**Name:** `EntryRevisionAfterCreateEventHandler`
**Import:** `import { EntryRevisionAfterCreateEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/events.ts`
**Description:** Hook into revision lifecycle after a revision is created.

---
**Name:** `EntryRevisionAfterDeleteEventHandler`
**Import:** `import { EntryRevisionAfterDeleteEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/events.ts`
**Description:** Hook into revision lifecycle after a revision is deleted.

---
**Name:** `EntryRevisionBeforeCreateEventHandler`
**Import:** `import { EntryRevisionBeforeCreateEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/events.ts`
**Description:** Hook into revision lifecycle before a revision is created.

---
**Name:** `EntryRevisionBeforeDeleteEventHandler`
**Import:** `import { EntryRevisionBeforeDeleteEventHandler } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/events.ts`
**Description:** Hook into revision lifecycle before a revision is deleted.

---
**Name:** `FieldType`
**Import:** `import { FieldType } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/fields/abstractions.ts`
**Description:** Use to implement new field types.

---
**Name:** `FieldTypeValidator`
**Kind:** type
**Import:** `import type { FieldTypeValidator } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/fields/fieldTypeValidator.ts`

---
**Name:** `GetEntriesByIdsUseCase`
**Import:** `import { GetEntriesByIdsUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetEntriesByIds/abstractions.ts`
**Description:** Retrieve multiple content entries by their IDs.

---
**Name:** `GetEntryByIdUseCase`
**Import:** `import { GetEntryByIdUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetEntryById/abstractions.ts`
**Description:** Retrieve a content entry by its exact revision ID.

---
**Name:** `GetEntryUseCase`
**Import:** `import { GetEntryUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetEntry/abstractions.ts`
**Description:** Retrieve a content entry.

---
**Name:** `GetGroupUseCase`
**Import:** `import { GetGroupUseCase } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/GetGroup/abstractions.ts`
**Description:** Retrieve a content model group.

---
**Name:** `GetLatestDeletedRevisionByEntryIdUseCase`
**Import:** `import { GetLatestDeletedRevisionByEntryIdUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.ts`
**Description:** Retrieve the latest deleted revision of an entry.

---
**Name:** `GetLatestEntriesByIdsUseCase`
**Import:** `import { GetLatestEntriesByIdsUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetLatestEntriesByIds/abstractions.ts`
**Description:** Retrieve the latest revisions for multiple entries.

---
**Name:** `GetLatestRevisionByEntryIdBaseUseCase`
**Import:** `import { GetLatestRevisionByEntryIdBaseUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.ts`
**Description:** Base use case for retrieving the latest entry revision.

---
**Name:** `GetLatestRevisionByEntryIdIncludingDeletedUseCase`
**Import:** `import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.ts`
**Description:** Retrieve the latest entry revision, including deleted ones.

---
**Name:** `GetLatestRevisionByEntryIdUseCase`
**Import:** `import { GetLatestRevisionByEntryIdUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.ts`
**Description:** Retrieve the latest revision of an entry.

---
**Name:** `GetModelUseCase`
**Import:** `import { GetModelUseCase } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.ts`
**Description:** Retrieve a content model.

---
**Name:** `GetPreviousRevisionByEntryIdBaseUseCase`
**Import:** `import { GetPreviousRevisionByEntryIdBaseUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetPreviousRevisionByEntryId/abstractions.ts`
**Description:** Base use case for retrieving the previous entry revision.

---
**Name:** `GetPreviousRevisionByEntryIdUseCase`
**Import:** `import { GetPreviousRevisionByEntryIdUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetPreviousRevisionByEntryId/abstractions.ts`
**Description:** Retrieve the previous revision of an entry.

---
**Name:** `GetPublishedEntriesByIdsUseCase`
**Import:** `import { GetPublishedEntriesByIdsUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetPublishedEntriesByIds/abstractions.ts`
**Description:** Retrieve published revisions for multiple entries.

---
**Name:** `GetPublishedRevisionByEntryIdUseCase`
**Import:** `import { GetPublishedRevisionByEntryIdUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetPublishedRevisionByEntryId/abstractions.ts`
**Description:** Retrieve the published revision of an entry.

---
**Name:** `GetRevisionByIdUseCase`
**Import:** `import { GetRevisionByIdUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.ts`
**Description:** Retrieve a specific entry revision by ID.

---
**Name:** `GetRevisionsByEntryIdUseCase`
**Import:** `import { GetRevisionsByEntryIdUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetRevisionsByEntryId/abstractions.ts`
**Description:** Retrieve all revisions of an entry.

---
**Name:** `GetSingletonEntryUseCase`
**Import:** `import { GetSingletonEntryUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetSingletonEntry/abstractions.ts`
**Description:** Retrieve a singleton content entry.

---
**Name:** `GroupAfterCreateEventHandler`
**Import:** `import { GroupAfterCreateEventHandler } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/events.ts`
**Description:** Hook into group lifecycle after a group is created.

---
**Name:** `GroupAfterDeleteEventHandler`
**Import:** `import { GroupAfterDeleteEventHandler } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/events.ts`
**Description:** Hook into group lifecycle after a group is deleted.

---
**Name:** `GroupAfterUpdateEventHandler`
**Import:** `import { GroupAfterUpdateEventHandler } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/events.ts`
**Description:** Hook into group lifecycle after a group is updated.

---
**Name:** `GroupBeforeCreateEventHandler`
**Import:** `import { GroupBeforeCreateEventHandler } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/events.ts`
**Description:** Hook into group lifecycle before a group is created.

---
**Name:** `GroupBeforeDeleteEventHandler`
**Import:** `import { GroupBeforeDeleteEventHandler } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/events.ts`
**Description:** Hook into group lifecycle before a group is deleted.

---
**Name:** `GroupBeforeUpdateEventHandler`
**Import:** `import { GroupBeforeUpdateEventHandler } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/events.ts`
**Description:** Hook into group lifecycle before a group is updated.

---
**Name:** `IFieldBuilderRegistry`
**Kind:** type
**Import:** `import type { IFieldBuilderRegistry } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/abstractions.ts`
**Description:** Augmentable field builder registry. Provides access to all registered field types.

---
**Name:** `IFieldRendererRegistry`
**Kind:** type
**Import:** `import type { IFieldRendererRegistry } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/fields/DataFieldBuilder.ts`
**Description:** Augmentable renderer registry. Each entry maps a renderer name to its applicable field type(s) and settings.

---
**Name:** `LayoutBuilder`
**Import:** `import { LayoutBuilder } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/LayoutBuilder.ts`
**Description:** LayoutBuilder provides a fluent API for modifying field layouts.
Supports adding fields to existing rows and inserting new rows at specific positions.
Callbacks can be queued and executed lazily for efficient composition.

---
**Name:** `LayoutFieldBuilder`
**Import:** `import { LayoutFieldBuilder } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/fields/FieldBuilder.ts`
**Description:** Slim base class for layout fields (separators, alerts, tabs, etc.).
Layout fields only support label, description, help, and note — no list(), storageId(), etc.

---
**Name:** `ListDeletedEntriesUseCase`
**Import:** `import { ListDeletedEntriesUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.ts`
**Description:** List deleted content entries.

---
**Name:** `ListEntriesUseCase`
**Import:** `import { ListEntriesUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.ts`
**Description:** List content entries with filtering and pagination.

---
**Name:** `ListGroupsUseCase`
**Import:** `import { ListGroupsUseCase } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/ListGroups/abstractions.ts`
**Description:** List all content model groups.

---
**Name:** `ListLatestEntriesUseCase`
**Import:** `import { ListLatestEntriesUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.ts`
**Description:** List the latest revisions of content entries.

---
**Name:** `ListModelsUseCase`
**Import:** `import { ListModelsUseCase } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/ListModels/abstractions.ts`
**Description:** List all content models.

---
**Name:** `ListPublishedEntriesUseCase`
**Import:** `import { ListPublishedEntriesUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.ts`
**Description:** List published content entries.

---
**Name:** `ModelAfterCreateEventHandler`
**Import:** `import { ModelAfterCreateEventHandler } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/CreateModel/events.ts`
**Description:** Hook into model lifecycle after a model is created.

---
**Name:** `ModelAfterCreateFromEventHandler`
**Import:** `import { ModelAfterCreateFromEventHandler } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.ts`
**Description:** Hook into model lifecycle after a model is cloned.

---
**Name:** `ModelAfterDeleteEventHandler`
**Import:** `import { ModelAfterDeleteEventHandler } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/DeleteModel/events.ts`
**Description:** Hook into model lifecycle after a model is deleted.

---
**Name:** `ModelAfterUpdateEventHandler`
**Import:** `import { ModelAfterUpdateEventHandler } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/UpdateModel/events.ts`
**Description:** Hook into model lifecycle after a model is updated.

---
**Name:** `ModelBeforeCreateEventHandler`
**Import:** `import { ModelBeforeCreateEventHandler } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/CreateModel/events.ts`
**Description:** Hook into model lifecycle before a model is created.

---
**Name:** `ModelBeforeCreateFromEventHandler`
**Import:** `import { ModelBeforeCreateFromEventHandler } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.ts`
**Description:** Hook into model lifecycle before a model is cloned.

---
**Name:** `ModelBeforeDeleteEventHandler`
**Import:** `import { ModelBeforeDeleteEventHandler } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/DeleteModel/events.ts`
**Description:** Hook into model lifecycle before a model is deleted.

---
**Name:** `ModelBeforeUpdateEventHandler`
**Import:** `import { ModelBeforeUpdateEventHandler } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/UpdateModel/events.ts`
**Description:** Hook into model lifecycle before a model is updated.

---
**Name:** `ModelBuilder`
**Import:** `import { ModelBuilder } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/models/ModelBuilder.ts`
**Description:** Entry point builder that allows selecting model type.
Call .private() or .public() to get the appropriate typed builder.

---
**Name:** `ModelFactory`
**Import:** `import { ModelFactory } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/abstractions.ts`
**Description:** Provide code-defined content models.

---
**Name:** `ModelGroupFactory`
**Import:** `import { ModelGroupFactory } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/shared/abstractions.ts`
**Description:** Provide code-defined content model groups.

---
**Name:** `MoveEntryToBinUseCase`
**Import:** `import { MoveEntryToBinUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/abstractions.ts`
**Description:** Move a content entry to the recycle bin.

---
**Name:** `MoveEntryUseCase`
**Import:** `import { MoveEntryUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/MoveEntry/abstractions.ts`
**Description:** Move a content entry to a different folder.

---
**Name:** `PublishEntryUseCase`
**Import:** `import { PublishEntryUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/PublishEntry/abstractions.ts`
**Description:** Publish a content entry.

---
**Name:** `RepublishEntryUseCase`
**Import:** `import { RepublishEntryUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/RepublishEntry/abstractions.ts`
**Description:** Republish a content entry.

---
**Name:** `RestoreEntryFromBinUseCase`
**Import:** `import { RestoreEntryFromBinUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/abstractions.ts`
**Description:** Restore a content entry from the recycle bin.

---
**Name:** `SchedulePublishEntryUseCase`
**Import:** `import { SchedulePublishEntryUseCase } from "webiny/api/cms/scheduler"`
**Source:** `@webiny/api-headless-cms-scheduler/features/SchedulePublishEntryUseCase/abstractions.ts`
**Description:** Schedule an entry for future publishing.

---
**Name:** `ScheduleUnpublishEntryUseCase`
**Import:** `import { ScheduleUnpublishEntryUseCase } from "webiny/api/cms/scheduler"`
**Source:** `@webiny/api-headless-cms-scheduler/features/ScheduleUnpublishEntryUseCase/abstractions.ts`
**Description:** Schedule an entry for future unpublishing.

---
**Name:** `UnpublishEntryUseCase`
**Import:** `import { UnpublishEntryUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/abstractions.ts`
**Description:** Unpublish a content entry.

---
**Name:** `UpdateEntryUseCase`
**Import:** `import { UpdateEntryUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UpdateEntry/abstractions.ts`
**Description:** Update a content entry.

---
**Name:** `UpdateGroupUseCase`
**Import:** `import { UpdateGroupUseCase } from "webiny/api/cms/group"`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/abstractions.ts`
**Description:** Update a content model group.

---
**Name:** `UpdateModelUseCase`
**Import:** `import { UpdateModelUseCase } from "webiny/api/cms/model"`
**Source:** `@webiny/api-headless-cms/features/contentModel/UpdateModel/abstractions.ts`
**Description:** Update a content model.

---
**Name:** `UpdateSingletonEntryUseCase`
**Import:** `import { UpdateSingletonEntryUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UpdateSingletonEntry/abstractions.ts`
**Description:** Update a singleton content entry.

---
**Name:** `ValidateEntryUseCase`
**Import:** `import { ValidateEntryUseCase } from "webiny/api/cms/entry"`
**Source:** `@webiny/api-headless-cms/features/contentEntry/ValidateEntry/abstractions.ts`
**Description:** Validate a content entry against its model schema.

---
