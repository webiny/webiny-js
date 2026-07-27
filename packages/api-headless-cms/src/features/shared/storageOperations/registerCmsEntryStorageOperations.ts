import type { Container } from "@webiny/di";
import type { CmsEntryStorageOperations } from "~/types/index.js";
import { CreateEntryStorageOperation } from "./entry/CreateEntryStorageOperation.js";
import { CreateEntryRevisionFromStorageOperation } from "./entry/CreateEntryRevisionFromStorageOperation.js";
import { UpdateEntryStorageOperation } from "./entry/UpdateEntryStorageOperation.js";
import { DeleteEntryStorageOperation } from "./entry/DeleteEntryStorageOperation.js";
import { DeleteEntryRevisionStorageOperation } from "./entry/DeleteEntryRevisionStorageOperation.js";
import { DeleteMultipleEntriesStorageOperation } from "./entry/DeleteMultipleEntriesStorageOperation.js";
import { MoveToBinStorageOperation } from "./entry/MoveToBinStorageOperation.js";
import { RestoreFromBinStorageOperation } from "./entry/RestoreFromBinStorageOperation.js";
import { PublishEntryStorageOperation } from "./entry/PublishEntryStorageOperation.js";
import { UnpublishEntryStorageOperation } from "./entry/UnpublishEntryStorageOperation.js";
import { MoveEntryStorageOperation } from "./entry/MoveEntryStorageOperation.js";
import { GetEntryStorageOperation } from "./entry/GetEntryStorageOperation.js";
import { ListEntriesStorageOperation } from "./entry/ListEntriesStorageOperation.js";
import { GetEntriesByIdsStorageOperation } from "./entry/GetEntriesByIdsStorageOperation.js";
import { GetLatestEntriesByIdsStorageOperation } from "./entry/GetLatestEntriesByIdsStorageOperation.js";
import { GetPublishedEntriesByIdsStorageOperation } from "./entry/GetPublishedEntriesByIdsStorageOperation.js";
import { GetRevisionsStorageOperation } from "./entry/GetRevisionsStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "./entry/GetRevisionByIdStorageOperation.js";
import { GetPublishedRevisionByEntryIdStorageOperation } from "./entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "./entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { GetPreviousRevisionStorageOperation } from "./entry/GetPreviousRevisionStorageOperation.js";
import { GetUniqueFieldValuesStorageOperation } from "./entry/GetUniqueFieldValuesStorageOperation.js";

/**
 * Registers all 22 per-method entry storage operations abstractions from a single
 * `CmsEntryStorageOperations` object. Storage adapters call this per-request, once
 * request-scoped dependencies (CmsStorageModelProvider, StorageTransformRegistry) are
 * available to build the entries object.
 */
export const registerCmsEntryStorageOperations = (
    container: Container,
    entries: CmsEntryStorageOperations
): void => {
    container.registerInstance(CreateEntryStorageOperation, { execute: entries.create });
    container.registerInstance(CreateEntryRevisionFromStorageOperation, {
        execute: entries.createRevisionFrom
    });
    container.registerInstance(UpdateEntryStorageOperation, { execute: entries.update });
    container.registerInstance(DeleteEntryStorageOperation, { execute: entries.delete });
    container.registerInstance(DeleteEntryRevisionStorageOperation, {
        execute: entries.deleteRevision
    });
    container.registerInstance(DeleteMultipleEntriesStorageOperation, {
        execute: entries.deleteMultipleEntries
    });
    container.registerInstance(MoveToBinStorageOperation, { execute: entries.moveToBin });
    container.registerInstance(RestoreFromBinStorageOperation, {
        execute: entries.restoreFromBin
    });
    container.registerInstance(PublishEntryStorageOperation, { execute: entries.publish });
    container.registerInstance(UnpublishEntryStorageOperation, { execute: entries.unpublish });
    container.registerInstance(MoveEntryStorageOperation, { execute: entries.move });
    container.registerInstance(GetEntryStorageOperation, { execute: entries.get });
    container.registerInstance(ListEntriesStorageOperation, { execute: entries.list });
    container.registerInstance(GetEntriesByIdsStorageOperation, { execute: entries.getByIds });
    container.registerInstance(GetLatestEntriesByIdsStorageOperation, {
        execute: entries.getLatestByIds
    });
    container.registerInstance(GetPublishedEntriesByIdsStorageOperation, {
        execute: entries.getPublishedByIds
    });
    container.registerInstance(GetRevisionsStorageOperation, { execute: entries.getRevisions });
    container.registerInstance(GetRevisionByIdStorageOperation, {
        execute: entries.getRevisionById
    });
    container.registerInstance(GetPublishedRevisionByEntryIdStorageOperation, {
        execute: entries.getPublishedRevisionByEntryId
    });
    container.registerInstance(GetLatestRevisionByEntryIdStorageOperation, {
        execute: entries.getLatestRevisionByEntryId
    });
    container.registerInstance(GetPreviousRevisionStorageOperation, {
        execute: entries.getPreviousRevision
    });
    container.registerInstance(GetUniqueFieldValuesStorageOperation, {
        execute: entries.getUniqueFieldValues
    });
};
