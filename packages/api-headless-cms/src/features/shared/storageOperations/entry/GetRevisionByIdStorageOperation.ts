import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsGetRevisionParams
} from "~/types/types.js";

export interface IGetRevisionByIdStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ): Promise<CmsEntry<T> | null>;
}

export const GetRevisionByIdStorageOperation = createAbstraction<IGetRevisionByIdStorageOperation>(
    "Cms/Entry/GetRevisionByIdStorageOperation"
);

export namespace GetRevisionByIdStorageOperation {
    export type Interface = IGetRevisionByIdStorageOperation;
}
