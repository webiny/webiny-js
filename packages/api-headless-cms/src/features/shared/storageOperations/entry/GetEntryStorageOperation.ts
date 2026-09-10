import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsGetParams
} from "~/types/index.js";

export interface IGetEntryStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ): Promise<CmsEntry<T> | null>;
}

export const GetEntryStorageOperation = createAbstraction<IGetEntryStorageOperation>(
    "Cms/Entry/GetEntryStorageOperation"
);

export namespace GetEntryStorageOperation {
    export type Interface = IGetEntryStorageOperation;
}
