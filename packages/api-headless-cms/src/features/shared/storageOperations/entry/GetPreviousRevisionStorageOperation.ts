import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsGetPreviousRevisionParams
} from "~/types/index.js";

export interface IGetPreviousRevisionStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ): Promise<CmsEntry<T> | null>;
}

export const GetPreviousRevisionStorageOperation =
    createAbstraction<IGetPreviousRevisionStorageOperation>(
        "Cms/Entry/GetPreviousRevisionStorageOperation"
    );

export namespace GetPreviousRevisionStorageOperation {
    export type Interface = IGetPreviousRevisionStorageOperation;
}
