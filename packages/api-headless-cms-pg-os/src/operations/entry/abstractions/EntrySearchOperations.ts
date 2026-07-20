import { createAbstraction } from "@webiny/feature/api/index.js";
import type {
    CmsEntry,
    CmsEntryStorageOperationsGetParams,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsListResponse,
    CmsEntryUniqueValue,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";

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

export const EntrySearchOperations = createAbstraction<IEntrySearchOperations>(
    "Cms/PgOs/EntrySearchOperations"
);

export namespace EntrySearchOperations {
    export type Interface = IEntrySearchOperations;
}
