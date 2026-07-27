import type { Container } from "@webiny/di";
import type { CmsGroupStorageOperations, CmsModelStorageOperations } from "~/types/index.js";
import { GroupStorageOperations } from "./GroupStorageOperations.js";
import { ModelStorageOperations } from "./ModelStorageOperations.js";
import type { ICreateEntryStorageOperation } from "./entry/CreateEntryStorageOperation.js";
import { CreateEntryStorageOperation } from "./entry/CreateEntryStorageOperation.js";
import type { ICreateEntryRevisionFromStorageOperation } from "./entry/CreateEntryRevisionFromStorageOperation.js";
import { CreateEntryRevisionFromStorageOperation } from "./entry/CreateEntryRevisionFromStorageOperation.js";
import type { IUpdateEntryStorageOperation } from "./entry/UpdateEntryStorageOperation.js";
import { UpdateEntryStorageOperation } from "./entry/UpdateEntryStorageOperation.js";
import type { IDeleteEntryStorageOperation } from "./entry/DeleteEntryStorageOperation.js";
import { DeleteEntryStorageOperation } from "./entry/DeleteEntryStorageOperation.js";
import type { IDeleteEntryRevisionStorageOperation } from "./entry/DeleteEntryRevisionStorageOperation.js";
import { DeleteEntryRevisionStorageOperation } from "./entry/DeleteEntryRevisionStorageOperation.js";
import type { IDeleteMultipleEntriesStorageOperation } from "./entry/DeleteMultipleEntriesStorageOperation.js";
import { DeleteMultipleEntriesStorageOperation } from "./entry/DeleteMultipleEntriesStorageOperation.js";
import type { IMoveToBinStorageOperation } from "./entry/MoveToBinStorageOperation.js";
import { MoveToBinStorageOperation } from "./entry/MoveToBinStorageOperation.js";
import type { IRestoreFromBinStorageOperation } from "./entry/RestoreFromBinStorageOperation.js";
import { RestoreFromBinStorageOperation } from "./entry/RestoreFromBinStorageOperation.js";
import type { IPublishEntryStorageOperation } from "./entry/PublishEntryStorageOperation.js";
import { PublishEntryStorageOperation } from "./entry/PublishEntryStorageOperation.js";
import type { IUnpublishEntryStorageOperation } from "./entry/UnpublishEntryStorageOperation.js";
import { UnpublishEntryStorageOperation } from "./entry/UnpublishEntryStorageOperation.js";
import type { IMoveEntryStorageOperation } from "./entry/MoveEntryStorageOperation.js";
import { MoveEntryStorageOperation } from "./entry/MoveEntryStorageOperation.js";
import type { IGetEntryStorageOperation } from "./entry/GetEntryStorageOperation.js";
import { GetEntryStorageOperation } from "./entry/GetEntryStorageOperation.js";
import type { IListEntriesStorageOperation } from "./entry/ListEntriesStorageOperation.js";
import { ListEntriesStorageOperation } from "./entry/ListEntriesStorageOperation.js";
import type { IGetEntriesByIdsStorageOperation } from "./entry/GetEntriesByIdsStorageOperation.js";
import { GetEntriesByIdsStorageOperation } from "./entry/GetEntriesByIdsStorageOperation.js";
import type { IGetLatestEntriesByIdsStorageOperation } from "./entry/GetLatestEntriesByIdsStorageOperation.js";
import { GetLatestEntriesByIdsStorageOperation } from "./entry/GetLatestEntriesByIdsStorageOperation.js";
import type { IGetPublishedEntriesByIdsStorageOperation } from "./entry/GetPublishedEntriesByIdsStorageOperation.js";
import { GetPublishedEntriesByIdsStorageOperation } from "./entry/GetPublishedEntriesByIdsStorageOperation.js";
import type { IGetRevisionsStorageOperation } from "./entry/GetRevisionsStorageOperation.js";
import { GetRevisionsStorageOperation } from "./entry/GetRevisionsStorageOperation.js";
import type { IGetRevisionByIdStorageOperation } from "./entry/GetRevisionByIdStorageOperation.js";
import { GetRevisionByIdStorageOperation } from "./entry/GetRevisionByIdStorageOperation.js";
import type { IGetPublishedRevisionByEntryIdStorageOperation } from "./entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import { GetPublishedRevisionByEntryIdStorageOperation } from "./entry/GetPublishedRevisionByEntryIdStorageOperation.js";
import type { IGetLatestRevisionByEntryIdStorageOperation } from "./entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "./entry/GetLatestRevisionByEntryIdStorageOperation.js";
import type { IGetPreviousRevisionStorageOperation } from "./entry/GetPreviousRevisionStorageOperation.js";
import { GetPreviousRevisionStorageOperation } from "./entry/GetPreviousRevisionStorageOperation.js";
import type { IGetUniqueFieldValuesStorageOperation } from "./entry/GetUniqueFieldValuesStorageOperation.js";
import { GetUniqueFieldValuesStorageOperation } from "./entry/GetUniqueFieldValuesStorageOperation.js";

/**
 * The set of per-method CMS storage abstractions a storage adapter (ddb / ddb-es / sql / ...)
 * must provide. TypeScript enforces completeness of the `entries` map, so adding a new entry
 * abstraction here surfaces a compile error at every adapter until it is wired up.
 */
export interface ICmsStorageOperationsRegistry {
    groups: CmsGroupStorageOperations;
    models: CmsModelStorageOperations;
    entries: {
        create: ICreateEntryStorageOperation;
        createRevisionFrom: ICreateEntryRevisionFromStorageOperation;
        update: IUpdateEntryStorageOperation;
        delete: IDeleteEntryStorageOperation;
        deleteRevision: IDeleteEntryRevisionStorageOperation;
        deleteMultipleEntries: IDeleteMultipleEntriesStorageOperation;
        moveToBin: IMoveToBinStorageOperation;
        restoreFromBin: IRestoreFromBinStorageOperation;
        publish: IPublishEntryStorageOperation;
        unpublish: IUnpublishEntryStorageOperation;
        move: IMoveEntryStorageOperation;
        get: IGetEntryStorageOperation;
        list: IListEntriesStorageOperation;
        getByIds: IGetEntriesByIdsStorageOperation;
        getLatestByIds: IGetLatestEntriesByIdsStorageOperation;
        getPublishedByIds: IGetPublishedEntriesByIdsStorageOperation;
        getRevisions: IGetRevisionsStorageOperation;
        getRevisionById: IGetRevisionByIdStorageOperation;
        getPublishedRevisionByEntryId: IGetPublishedRevisionByEntryIdStorageOperation;
        getLatestRevisionByEntryId: IGetLatestRevisionByEntryIdStorageOperation;
        getPreviousRevision: IGetPreviousRevisionStorageOperation;
        getUniqueFieldValues: IGetUniqueFieldValuesStorageOperation;
    };
}

/**
 * Registers all 24 per-method CMS storage operations abstractions (group, model, and 22 entry
 * abstractions) from a single registry object.
 */
export function registerCmsStorageOperations(
    container: Container,
    registry: ICmsStorageOperationsRegistry
): void {
    container.registerInstance(GroupStorageOperations, registry.groups);
    container.registerInstance(ModelStorageOperations, registry.models);

    container.registerInstance(CreateEntryStorageOperation, registry.entries.create);
    container.registerInstance(
        CreateEntryRevisionFromStorageOperation,
        registry.entries.createRevisionFrom
    );
    container.registerInstance(UpdateEntryStorageOperation, registry.entries.update);
    container.registerInstance(DeleteEntryStorageOperation, registry.entries.delete);
    container.registerInstance(
        DeleteEntryRevisionStorageOperation,
        registry.entries.deleteRevision
    );
    container.registerInstance(
        DeleteMultipleEntriesStorageOperation,
        registry.entries.deleteMultipleEntries
    );
    container.registerInstance(MoveToBinStorageOperation, registry.entries.moveToBin);
    container.registerInstance(RestoreFromBinStorageOperation, registry.entries.restoreFromBin);
    container.registerInstance(PublishEntryStorageOperation, registry.entries.publish);
    container.registerInstance(UnpublishEntryStorageOperation, registry.entries.unpublish);
    container.registerInstance(MoveEntryStorageOperation, registry.entries.move);
    container.registerInstance(GetEntryStorageOperation, registry.entries.get);
    container.registerInstance(ListEntriesStorageOperation, registry.entries.list);
    container.registerInstance(GetEntriesByIdsStorageOperation, registry.entries.getByIds);
    container.registerInstance(
        GetLatestEntriesByIdsStorageOperation,
        registry.entries.getLatestByIds
    );
    container.registerInstance(
        GetPublishedEntriesByIdsStorageOperation,
        registry.entries.getPublishedByIds
    );
    container.registerInstance(GetRevisionsStorageOperation, registry.entries.getRevisions);
    container.registerInstance(GetRevisionByIdStorageOperation, registry.entries.getRevisionById);
    container.registerInstance(
        GetPublishedRevisionByEntryIdStorageOperation,
        registry.entries.getPublishedRevisionByEntryId
    );
    container.registerInstance(
        GetLatestRevisionByEntryIdStorageOperation,
        registry.entries.getLatestRevisionByEntryId
    );
    container.registerInstance(
        GetPreviousRevisionStorageOperation,
        registry.entries.getPreviousRevision
    );
    container.registerInstance(
        GetUniqueFieldValuesStorageOperation,
        registry.entries.getUniqueFieldValues
    );
}
