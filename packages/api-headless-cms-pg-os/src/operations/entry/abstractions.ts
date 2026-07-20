import { createAbstraction } from "@webiny/feature/api/index.js";
import type {
    CmsEntry,
    CmsEntryStorageOperationsCreateParams,
    CmsEntryStorageOperationsCreateRevisionFromParams,
    CmsEntryStorageOperationsDeleteEntriesParams,
    CmsEntryStorageOperationsDeleteParams,
    CmsEntryStorageOperationsDeleteRevisionParams,
    CmsEntryStorageOperationsGetParams,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsListResponse,
    CmsEntryStorageOperationsMoveToBinParams,
    CmsEntryStorageOperationsPublishParams,
    CmsEntryStorageOperationsRestoreFromBinParams,
    CmsEntryStorageOperationsUnpublishParams,
    CmsEntryStorageOperationsUpdateParams,
    CmsEntryUniqueValue,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";

export interface IEntryWriteOperations {
    create<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateParams<T>
    ): Promise<CmsEntry<T>>;
    createRevisionFrom<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams<T>
    ): Promise<CmsEntry<T>>;
    update<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ): Promise<CmsEntry<T>>;
    publish<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsPublishParams<T>
    ): Promise<CmsEntry<T>>;
    unpublish<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUnpublishParams<T>
    ): Promise<CmsEntry<T>>;
    move(model: CmsModel, id: string, folderId: string): Promise<void>;
    moveToBin(model: CmsModel, params: CmsEntryStorageOperationsMoveToBinParams): Promise<void>;
    restoreFromBin<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsRestoreFromBinParams<T>
    ): Promise<CmsEntry<T>>;
    delete(model: CmsModel, params: CmsEntryStorageOperationsDeleteParams): Promise<void>;
    deleteRevision<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams<T>
    ): Promise<void>;
    deleteMultipleEntries(
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteEntriesParams
    ): Promise<void>;
}

export const EntryWriteOperations =
    createAbstraction<IEntryWriteOperations>("Cms/PgOs/EntryWriteOperations");

export namespace EntryWriteOperations {
    export type Interface = IEntryWriteOperations;
}

export interface IEntrySearchOperations {
    get<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ): Promise<CmsEntry<T> | null>;
    list<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ): Promise<CmsEntryStorageOperationsListResponse<CmsEntry<T>>>;
    getUniqueFieldValues(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetUniqueFieldValuesParams
    ): Promise<CmsEntryUniqueValue[]>;
}

export const EntrySearchOperations =
    createAbstraction<IEntrySearchOperations>("Cms/PgOs/EntrySearchOperations");

export namespace EntrySearchOperations {
    export type Interface = IEntrySearchOperations;
}
