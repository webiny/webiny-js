import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsGetLatestRevisionParams
} from "~/types/index.js";

export interface IGetLatestRevisionByEntryIdStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ): Promise<CmsEntry<T> | null>;
}

export const GetLatestRevisionByEntryIdStorageOperation =
    createAbstraction<IGetLatestRevisionByEntryIdStorageOperation>(
        "Cms/Entry/GetLatestRevisionByEntryIdStorageOperation"
    );

export namespace GetLatestRevisionByEntryIdStorageOperation {
    export type Interface = IGetLatestRevisionByEntryIdStorageOperation;
}
