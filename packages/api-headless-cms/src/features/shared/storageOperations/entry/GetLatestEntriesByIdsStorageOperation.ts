import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsGetLatestByIdsParams
} from "~/types/types.js";

export interface IGetLatestEntriesByIdsStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestByIdsParams
    ): Promise<CmsEntry<T>[]>;
}

export const GetLatestEntriesByIdsStorageOperation =
    createAbstraction<IGetLatestEntriesByIdsStorageOperation>(
        "Cms/Entry/GetLatestEntriesByIdsStorageOperation"
    );

export namespace GetLatestEntriesByIdsStorageOperation {
    export type Interface = IGetLatestEntriesByIdsStorageOperation;
}
