---
name: webiny-api-cms-catalog
context: webiny-api
description: >
  API — Headless CMS — 91 abstractions.
  Entry, model, and group event handlers and use cases.
---

# API — Headless CMS

Entry, model, and group event handlers and use cases.

## How to Use

1. Find the abstraction you need in the table below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

| Class | Import | Source |
|-------|--------|--------|
| `CmsSortMapper` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/sortMapper/abstractions.ts` |
| `CmsWhereMapper` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/whereMapper/abstractions.ts` |
| `CreateEntryRevisionFromUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/abstractions.ts` |
| `CreateEntryUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/CreateEntry/abstractions.ts` |
| `CreateGroupUseCase` | `webiny/api/cms/group` | `@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/abstractions.ts` |
| `CreateModelFromUseCase` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/CreateModelFrom/abstractions.ts` |
| `CreateModelUseCase` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/CreateModel/abstractions.ts` |
| `DeleteEntryRevisionUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/abstractions.ts` |
| `DeleteEntryUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/abstractions.ts` |
| `DeleteGroupUseCase` | `webiny/api/cms/group` | `@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/abstractions.ts` |
| `DeleteModelUseCase` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/DeleteModel/abstractions.ts` |
| `DeleteMultipleEntriesUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/abstractions.ts` |
| `EntryAfterCreateEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.ts` |
| `EntryAfterDeleteEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.ts` |
| `EntryAfterDeleteMultipleEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/events.ts` |
| `EntryAfterMoveEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/MoveEntry/events.ts` |
| `EntryAfterPublishEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.ts` |
| `EntryAfterRepublishEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/RepublishEntry/events.ts` |
| `EntryAfterRestoreFromBinEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.ts` |
| `EntryAfterUnpublishEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events.ts` |
| `EntryAfterUpdateEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.ts` |
| `EntryBeforeCreateEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/CreateEntry/events.ts` |
| `EntryBeforeDeleteEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events.ts` |
| `EntryBeforeDeleteMultipleEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/events.ts` |
| `EntryBeforeMoveEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/MoveEntry/events.ts` |
| `EntryBeforePublishEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/PublishEntry/events.ts` |
| `EntryBeforeRepublishEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/RepublishEntry/events.ts` |
| `EntryBeforeRestoreFromBinEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/events.ts` |
| `EntryBeforeUnpublishEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events.ts` |
| `EntryBeforeUpdateEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/UpdateEntry/events.ts` |
| `EntryId` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/domain/contentEntry/EntryId.ts` |
| `EntryRevisionAfterCreateEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/events.ts` |
| `EntryRevisionAfterDeleteEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/events.ts` |
| `EntryRevisionBeforeCreateEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/events.ts` |
| `EntryRevisionBeforeDeleteEventHandler` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/events.ts` |
| `FieldBuilder` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/modelBuilder/fields/FieldBuilder.ts` |
| `FieldType` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/modelBuilder/fields/abstractions.ts` |
| `GetEntriesByIdsUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetEntriesByIds/abstractions.ts` |
| `GetEntryByIdUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetEntryById/abstractions.ts` |
| `GetEntryUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetEntry/abstractions.ts` |
| `GetGroupUseCase` | `webiny/api/cms/group` | `@webiny/api-headless-cms/features/contentModelGroup/GetGroup/abstractions.ts` |
| `GetLatestDeletedRevisionByEntryIdUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.ts` |
| `GetLatestEntriesByIdsUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetLatestEntriesByIds/abstractions.ts` |
| `GetLatestRevisionByEntryIdBaseUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.ts` |
| `GetLatestRevisionByEntryIdIncludingDeletedUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.ts` |
| `GetLatestRevisionByEntryIdUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/abstractions.ts` |
| `GetModelUseCase` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/GetModel/abstractions.ts` |
| `GetPreviousRevisionByEntryIdBaseUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetPreviousRevisionByEntryId/abstractions.ts` |
| `GetPreviousRevisionByEntryIdUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetPreviousRevisionByEntryId/abstractions.ts` |
| `GetPublishedEntriesByIdsUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetPublishedEntriesByIds/abstractions.ts` |
| `GetPublishedRevisionByEntryIdUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetPublishedRevisionByEntryId/abstractions.ts` |
| `GetRevisionByIdUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetRevisionById/abstractions.ts` |
| `GetRevisionsByEntryIdUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetRevisionsByEntryId/abstractions.ts` |
| `GetSingletonEntryUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/GetSingletonEntry/abstractions.ts` |
| `GroupAfterCreateEventHandler` | `webiny/api/cms/group` | `@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/events.ts` |
| `GroupAfterDeleteEventHandler` | `webiny/api/cms/group` | `@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/events.ts` |
| `GroupAfterUpdateEventHandler` | `webiny/api/cms/group` | `@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/events.ts` |
| `GroupBeforeCreateEventHandler` | `webiny/api/cms/group` | `@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/events.ts` |
| `GroupBeforeDeleteEventHandler` | `webiny/api/cms/group` | `@webiny/api-headless-cms/features/contentModelGroup/DeleteGroup/events.ts` |
| `GroupBeforeUpdateEventHandler` | `webiny/api/cms/group` | `@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/events.ts` |
| `LayoutBuilder` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/modelBuilder/LayoutBuilder.ts` |
| `ListDeletedEntriesUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.ts` |
| `ListEntriesUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.ts` |
| `ListGroupsUseCase` | `webiny/api/cms/group` | `@webiny/api-headless-cms/features/contentModelGroup/ListGroups/abstractions.ts` |
| `ListLatestEntriesUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.ts` |
| `ListModelsUseCase` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/ListModels/abstractions.ts` |
| `ListPublishedEntriesUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.ts` |
| `ModelAfterCreateEventHandler` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/CreateModel/events.ts` |
| `ModelAfterCreateFromEventHandler` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.ts` |
| `ModelAfterDeleteEventHandler` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/DeleteModel/events.ts` |
| `ModelAfterUpdateEventHandler` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/UpdateModel/events.ts` |
| `ModelBeforeCreateEventHandler` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/CreateModel/events.ts` |
| `ModelBeforeCreateFromEventHandler` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.ts` |
| `ModelBeforeDeleteEventHandler` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/DeleteModel/events.ts` |
| `ModelBeforeUpdateEventHandler` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/UpdateModel/events.ts` |
| `ModelBuilder` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/modelBuilder/models/ModelBuilder.ts` |
| `ModelFactory` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/modelBuilder/abstractions.ts` |
| `ModelGroupFactory` | `webiny/api/cms/group` | `@webiny/api-headless-cms/features/contentModelGroup/shared/abstractions.ts` |
| `MoveEntryToBinUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/DeleteEntry/abstractions.ts` |
| `MoveEntryUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/MoveEntry/abstractions.ts` |
| `PublishEntryUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/PublishEntry/abstractions.ts` |
| `RepublishEntryUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/RepublishEntry/abstractions.ts` |
| `RestoreEntryFromBinUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/abstractions.ts` |
| `SchedulePublishEntryUseCase` | `webiny/api/cms/scheduler` | `@webiny/api-headless-cms-scheduler/features/SchedulePublishEntryUseCase/abstractions.ts` |
| `ScheduleUnpublishEntryUseCase` | `webiny/api/cms/scheduler` | `@webiny/api-headless-cms-scheduler/features/ScheduleUnpublishEntryUseCase/abstractions.ts` |
| `UnpublishEntryUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/abstractions.ts` |
| `UpdateEntryUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/UpdateEntry/abstractions.ts` |
| `UpdateGroupUseCase` | `webiny/api/cms/group` | `@webiny/api-headless-cms/features/contentModelGroup/UpdateGroup/abstractions.ts` |
| `UpdateModelUseCase` | `webiny/api/cms/model` | `@webiny/api-headless-cms/features/contentModel/UpdateModel/abstractions.ts` |
| `UpdateSingletonEntryUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/UpdateSingletonEntry/abstractions.ts` |
| `ValidateEntryUseCase` | `webiny/api/cms/entry` | `@webiny/api-headless-cms/features/contentEntry/ValidateEntry/abstractions.ts` |
