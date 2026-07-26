import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsGetRevisionsParams
} from "~/types/index.js";

export interface IGetRevisionsStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionsParams
    ): Promise<CmsEntry<T>[]>;
}

export const GetRevisionsStorageOperation = createAbstraction<IGetRevisionsStorageOperation>(
    "Cms/Entry/GetRevisionsStorageOperation"
);

export namespace GetRevisionsStorageOperation {
    export type Interface = IGetRevisionsStorageOperation;
}
