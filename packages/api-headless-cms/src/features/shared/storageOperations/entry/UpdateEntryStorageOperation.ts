import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsUpdateParams
} from "~/types/index.js";

export interface IUpdateEntryStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ): Promise<CmsEntry<T>>;
}

export const UpdateEntryStorageOperation = createAbstraction<IUpdateEntryStorageOperation>(
    "Cms/Entry/UpdateEntryStorageOperation"
);

export namespace UpdateEntryStorageOperation {
    export type Interface = IUpdateEntryStorageOperation;
}
