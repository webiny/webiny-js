import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsGetByIdsParams
} from "~/types/types.js";

export interface IGetEntriesByIdsStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetByIdsParams
    ): Promise<CmsEntry<T>[]>;
}

export const GetEntriesByIdsStorageOperation = createAbstraction<IGetEntriesByIdsStorageOperation>(
    "Cms/Entry/GetEntriesByIdsStorageOperation"
);

export namespace GetEntriesByIdsStorageOperation {
    export type Interface = IGetEntriesByIdsStorageOperation;
}
