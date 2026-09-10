import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsGetPublishedByIdsParams
} from "~/types/index.js";

export interface IGetPublishedEntriesByIdsStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ): Promise<CmsEntry<T>[]>;
}

export const GetPublishedEntriesByIdsStorageOperation =
    createAbstraction<IGetPublishedEntriesByIdsStorageOperation>(
        "Cms/Entry/GetPublishedEntriesByIdsStorageOperation"
    );

export namespace GetPublishedEntriesByIdsStorageOperation {
    export type Interface = IGetPublishedEntriesByIdsStorageOperation;
}
