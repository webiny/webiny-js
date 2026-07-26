import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsRestoreFromBinParams
} from "~/types/index.js";

export interface IRestoreFromBinStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsRestoreFromBinParams<T>
    ): Promise<CmsEntry<T>>;
}

export const RestoreFromBinStorageOperation = createAbstraction<IRestoreFromBinStorageOperation>(
    "Cms/Entry/RestoreFromBinStorageOperation"
);

export namespace RestoreFromBinStorageOperation {
    export type Interface = IRestoreFromBinStorageOperation;
}
