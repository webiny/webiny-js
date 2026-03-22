---
name: webiny-api-cms-catalog
context: webiny-api
description: >
  API — Headless CMS — 92 abstractions.
  Entry, model, and group event handlers and use cases.
---

# API — Headless CMS

Entry, model, and group event handlers and use cases.

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Name:** `CmsSortMapper`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/sortMapper/abstractions.ts`
**Description:** Map CMS sort parameters to storage queries.

---
**Name:** `CmsWhereMapper`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/whereMapper/abstractions.ts`
**Description:** Map CMS filter conditions to storage queries.

---
**Name:** `CreateEntryRevisionFromUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/abstractions.ts`
**Description:** Create a new entry revision from an existing one.

---
**Name:** `CreateEntryUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/CreateEntry/abstractions.ts`
**Description:** Create a new content entry.

---
**Name:** `CreateGroupUseCase`
**Import:** `webiny/api/cms/group`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/abstractions.ts`
**Description:** Create a new content model group.

---
**Name:** `CreateModelFromUseCase`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/CreateModelFrom/abstractions.ts`
**Description:** Create a content model by cloning an existing one.

---
**Name:** `CreateModelUseCase`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/CreateModel/abstractions.ts`
**Description:** Create a new content model.

---
**Name:** `DataFieldBuilder`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/fields/FieldBuilder.ts`
**Description:** DataFieldBuilder class for data fields that produce CmsModelField instances.
Provides storageId, list, validation, renderer, and other data-field methods.

---
**Name:** `DeleteEntryRevisionUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/abstractions.ts`
**Description:** Delete a specific entry revision.

---
**Name:** `DeleteEntryUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/abstractions.ts`
**Description:** Delete a content entry.

---
**Name:** `DeleteGroupUseCase`
**Import:** `webiny/api/cms/group`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/abstractions.ts`
**Description:** Delete a content model group.

---
**Name:** `DeleteModelUseCase`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/DeleteModel/abstractions.ts`
**Description:** Delete a content model.

---
**Name:** `DeleteMultipleEntriesUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/abstractions.ts`
**Description:** Delete multiple content entries in batch.

---
**Name:** `EntryAfterCreateEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is created.

---
**Name:** `EntryAfterDeleteEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is deleted.

---
**Name:** `EntryAfterDeleteMultipleEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/events.ts`
**Description:** Hook into entry lifecycle after multiple entries are deleted.

---
**Name:** `EntryAfterMoveEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/MoveEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is moved.

---
**Name:** `EntryAfterPublishEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is published.

---
**Name:** `EntryAfterRepublishEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/RepublishEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is republished.

---
**Name:** `EntryAfterRestoreFromBinEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.ts`
**Description:** Hook into entry lifecycle after an entry is restored from bin.

---
**Name:** `EntryAfterUnpublishEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is unpublished.

---
**Name:** `EntryAfterUpdateEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.ts`
**Description:** Hook into entry lifecycle after an entry is updated.

---
**Name:** `EntryBeforeCreateEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is created.

---
**Name:** `EntryBeforeDeleteEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is deleted.

---
**Name:** `EntryBeforeDeleteMultipleEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/events.ts`
**Description:** Hook into entry lifecycle before multiple entries are deleted.

---
**Name:** `EntryBeforeMoveEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/MoveEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is moved.

---
**Name:** `EntryBeforePublishEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is published.

---
**Name:** `EntryBeforeRepublishEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/RepublishEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is republished.

---
**Name:** `EntryBeforeRestoreFromBinEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.ts`
**Description:** Hook into entry lifecycle before an entry is restored from bin.

---
**Name:** `EntryBeforeUnpublishEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is unpublished.

---
**Name:** `EntryBeforeUpdateEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.ts`
**Description:** Hook into entry lifecycle before an entry is updated.

---
**Name:** `EntryId`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/domain/contentEntry/EntryId.ts`
**Description:** Generate and parse content entry IDs.

---
**Name:** `EntryRevisionAfterCreateEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/events.ts`
**Description:** Hook into revision lifecycle after a revision is created.

---
**Name:** `EntryRevisionAfterDeleteEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/events.ts`
**Description:** Hook into revision lifecycle after a revision is deleted.

---
**Name:** `EntryRevisionBeforeCreateEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/events.ts`
**Description:** Hook into revision lifecycle before a revision is created.

---
**Name:** `EntryRevisionBeforeDeleteEventHandler`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/events.ts`
**Description:** Hook into revision lifecycle before a revision is deleted.

---
**Name:** `FieldType`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/fields/abstractions.ts`
**Description:** Use to implement new field types.

---
**Name:** `GetEntriesByIdsUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetEntriesByIds/abstractions.ts`
**Description:** Retrieve multiple content entries by their IDs.

---
**Name:** `GetEntryByIdUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetEntryById/abstractions.ts`
**Description:** Retrieve a content entry by its exact revision ID.

---
**Name:** `GetEntryUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetEntry/abstractions.ts`
**Description:** Retrieve a content entry.

---
**Name:** `GetGroupUseCase`
**Import:** `webiny/api/cms/group`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/GetGroup/abstractions.ts`
**Description:** Retrieve a content model group.

---
**Name:** `GetLatestDeletedRevisionByEntryIdUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.ts`
**Description:** Retrieve the latest deleted revision of an entry.

---
**Name:** `GetLatestEntriesByIdsUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetLatestEntriesByIds/abstractions.ts`
**Description:** Retrieve the latest revisions for multiple entries.

---
**Name:** `GetLatestRevisionByEntryIdBaseUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.ts`
**Description:** Base use case for retrieving the latest entry revision.

---
**Name:** `GetLatestRevisionByEntryIdIncludingDeletedUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.ts`
**Description:** Retrieve the latest entry revision, including deleted ones.

---
**Name:** `GetLatestRevisionByEntryIdUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.ts`
**Description:** Retrieve the latest revision of an entry.

---
**Name:** `GetModelUseCase`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.ts`
**Description:** Retrieve a content model.

---
**Name:** `GetPreviousRevisionByEntryIdBaseUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetPreviousRevisionByEntryId/abstractions.ts`
**Description:** Base use case for retrieving the previous entry revision.

---
**Name:** `GetPreviousRevisionByEntryIdUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetPreviousRevisionByEntryId/abstractions.ts`
**Description:** Retrieve the previous revision of an entry.

---
**Name:** `GetPublishedEntriesByIdsUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetPublishedEntriesByIds/abstractions.ts`
**Description:** Retrieve published revisions for multiple entries.

---
**Name:** `GetPublishedRevisionByEntryIdUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetPublishedRevisionByEntryId/abstractions.ts`
**Description:** Retrieve the published revision of an entry.

---
**Name:** `GetRevisionByIdUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.ts`
**Description:** Retrieve a specific entry revision by ID.

---
**Name:** `GetRevisionsByEntryIdUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetRevisionsByEntryId/abstractions.ts`
**Description:** Retrieve all revisions of an entry.

---
**Name:** `GetSingletonEntryUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/GetSingletonEntry/abstractions.ts`
**Description:** Retrieve a singleton content entry.

---
**Name:** `GroupAfterCreateEventHandler`
**Import:** `webiny/api/cms/group`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/events.ts`
**Description:** Hook into group lifecycle after a group is created.

---
**Name:** `GroupAfterDeleteEventHandler`
**Import:** `webiny/api/cms/group`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/events.ts`
**Description:** Hook into group lifecycle after a group is deleted.

---
**Name:** `GroupAfterUpdateEventHandler`
**Import:** `webiny/api/cms/group`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/events.ts`
**Description:** Hook into group lifecycle after a group is updated.

---
**Name:** `GroupBeforeCreateEventHandler`
**Import:** `webiny/api/cms/group`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/events.ts`
**Description:** Hook into group lifecycle before a group is created.

---
**Name:** `GroupBeforeDeleteEventHandler`
**Import:** `webiny/api/cms/group`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/events.ts`
**Description:** Hook into group lifecycle before a group is deleted.

---
**Name:** `GroupBeforeUpdateEventHandler`
**Import:** `webiny/api/cms/group`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/events.ts`
**Description:** Hook into group lifecycle before a group is updated.

---
**Name:** `LayoutBuilder`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/LayoutBuilder.ts`
**Description:** LayoutBuilder provides a fluent API for modifying field layouts.
Supports adding fields to existing rows and inserting new rows at specific positions.
Callbacks can be queued and executed lazily for efficient composition.

---
**Name:** `LayoutFieldBuilder`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/fields/FieldBuilder.ts`
**Description:** Slim base class for layout fields (separators, alerts, tabs, etc.).
Layout fields only support label, description, help, and note — no list(), storageId(), etc.

---
**Name:** `ListDeletedEntriesUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.ts`
**Description:** List deleted content entries.

---
**Name:** `ListEntriesUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.ts`
**Description:** List content entries with filtering and pagination.

---
**Name:** `ListGroupsUseCase`
**Import:** `webiny/api/cms/group`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/ListGroups/abstractions.ts`
**Description:** List all content model groups.

---
**Name:** `ListLatestEntriesUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.ts`
**Description:** List the latest revisions of content entries.

---
**Name:** `ListModelsUseCase`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/ListModels/abstractions.ts`
**Description:** List all content models.

---
**Name:** `ListPublishedEntriesUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.ts`
**Description:** List published content entries.

---
**Name:** `ModelAfterCreateEventHandler`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/CreateModel/events.ts`
**Description:** Hook into model lifecycle after a model is created.

---
**Name:** `ModelAfterCreateFromEventHandler`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.ts`
**Description:** Hook into model lifecycle after a model is cloned.

---
**Name:** `ModelAfterDeleteEventHandler`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/DeleteModel/events.ts`
**Description:** Hook into model lifecycle after a model is deleted.

---
**Name:** `ModelAfterUpdateEventHandler`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/UpdateModel/events.ts`
**Description:** Hook into model lifecycle after a model is updated.

---
**Name:** `ModelBeforeCreateEventHandler`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/CreateModel/events.ts`
**Description:** Hook into model lifecycle before a model is created.

---
**Name:** `ModelBeforeCreateFromEventHandler`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.ts`
**Description:** Hook into model lifecycle before a model is cloned.

---
**Name:** `ModelBeforeDeleteEventHandler`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/DeleteModel/events.ts`
**Description:** Hook into model lifecycle before a model is deleted.

---
**Name:** `ModelBeforeUpdateEventHandler`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/UpdateModel/events.ts`
**Description:** Hook into model lifecycle before a model is updated.

---
**Name:** `ModelBuilder`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/models/ModelBuilder.ts`
**Description:** Entry point builder that allows selecting model type.
Call .private() or .public() to get the appropriate typed builder.

---
**Name:** `ModelFactory`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/modelBuilder/abstractions.ts`
**Description:** Provide code-defined content models.

---
**Name:** `ModelGroupFactory`
**Import:** `webiny/api/cms/group`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/shared/abstractions.ts`
**Description:** Provide code-defined content model groups.

---
**Name:** `MoveEntryToBinUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/abstractions.ts`
**Description:** Move a content entry to the recycle bin.

---
**Name:** `MoveEntryUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/MoveEntry/abstractions.ts`
**Description:** Move a content entry to a different folder.

---
**Name:** `PublishEntryUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/PublishEntry/abstractions.ts`
**Description:** Publish a content entry.

---
**Name:** `RepublishEntryUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/RepublishEntry/abstractions.ts`
**Description:** Republish a content entry.

---
**Name:** `RestoreEntryFromBinUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/abstractions.ts`
**Description:** Restore a content entry from the recycle bin.

---
**Name:** `SchedulePublishEntryUseCase`
**Import:** `webiny/api/cms/scheduler`
**Source:** `@webiny/api-headless-cms-scheduler/features/SchedulePublishEntryUseCase/abstractions.ts`
**Description:** Schedule an entry for future publishing.

---
**Name:** `ScheduleUnpublishEntryUseCase`
**Import:** `webiny/api/cms/scheduler`
**Source:** `@webiny/api-headless-cms-scheduler/features/ScheduleUnpublishEntryUseCase/abstractions.ts`
**Description:** Schedule an entry for future unpublishing.

---
**Name:** `UnpublishEntryUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/abstractions.ts`
**Description:** Unpublish a content entry.

---
**Name:** `UpdateEntryUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UpdateEntry/abstractions.ts`
**Description:** Update a content entry.

---
**Name:** `UpdateGroupUseCase`
**Import:** `webiny/api/cms/group`
**Source:** `@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/abstractions.ts`
**Description:** Update a content model group.

---
**Name:** `UpdateModelUseCase`
**Import:** `webiny/api/cms/model`
**Source:** `@webiny/api-headless-cms/features/contentModel/UpdateModel/abstractions.ts`
**Description:** Update a content model.

---
**Name:** `UpdateSingletonEntryUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/UpdateSingletonEntry/abstractions.ts`
**Description:** Update a singleton content entry.

---
**Name:** `ValidateEntryUseCase`
**Import:** `webiny/api/cms/entry`
**Source:** `@webiny/api-headless-cms/features/contentEntry/ValidateEntry/abstractions.ts`
**Description:** Validate a content entry against its model schema.

---
