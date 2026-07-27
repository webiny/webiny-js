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
    container.registerInstance(CreateEntryStorageOperation, {
        execute: (...args) => entries.create(...args)
    });
    container.registerInstance(CreateEntryRevisionFromStorageOperation, {
        execute: (...args) => entries.createRevisionFrom(...args)
    });
    container.registerInstance(UpdateEntryStorageOperation, {
        execute: (...args) => entries.update(...args)
    });
    container.registerInstance(DeleteEntryStorageOperation, {
        execute: (...args) => entries.delete(...args)
    });
    container.registerInstance(DeleteEntryRevisionStorageOperation, {
        execute: (...args) => entries.deleteRevision(...args)
    });
    container.registerInstance(DeleteMultipleEntriesStorageOperation, {
        execute: (...args) => entries.deleteMultipleEntries(...args)
    });
    container.registerInstance(MoveToBinStorageOperation, {
        execute: (...args) => entries.moveToBin(...args)
    });
    container.registerInstance(RestoreFromBinStorageOperation, {
        execute: (...args) => entries.restoreFromBin(...args)
    });
    container.registerInstance(PublishEntryStorageOperation, {
        execute: (...args) => entries.publish(...args)
    });
    container.registerInstance(UnpublishEntryStorageOperation, {
        execute: (...args) => entries.unpublish(...args)
    });
    container.registerInstance(MoveEntryStorageOperation, {
        execute: (...args) => entries.move(...args)
    });
    container.registerInstance(GetEntryStorageOperation, {
        execute: (...args) => entries.get(...args)
    });
    container.registerInstance(ListEntriesStorageOperation, {
        execute: (...args) => entries.list(...args)
    });
    container.registerInstance(GetEntriesByIdsStorageOperation, {
        execute: (...args) => entries.getByIds(...args)
    });
    container.registerInstance(GetLatestEntriesByIdsStorageOperation, {
        execute: (...args) => entries.getLatestByIds(...args)
    });
    container.registerInstance(GetPublishedEntriesByIdsStorageOperation, {
        execute: (...args) => entries.getPublishedByIds(...args)
    });
    container.registerInstance(GetRevisionsStorageOperation, {
        execute: (...args) => entries.getRevisions(...args)
    });
    container.registerInstance(GetRevisionByIdStorageOperation, {
        execute: (...args) => entries.getRevisionById(...args)
    });
    container.registerInstance(GetPublishedRevisionByEntryIdStorageOperation, {
        execute: (...args) => entries.getPublishedRevisionByEntryId(...args)
    });
    container.registerInstance(GetLatestRevisionByEntryIdStorageOperation, {
        execute: (...args) => entries.getLatestRevisionByEntryId(...args)
    });
    container.registerInstance(GetPreviousRevisionStorageOperation, {
        execute: (...args) => entries.getPreviousRevision(...args)
    });
    container.registerInstance(GetUniqueFieldValuesStorageOperation, {
        execute: (...args) => entries.getUniqueFieldValues(...args)
    });
};
