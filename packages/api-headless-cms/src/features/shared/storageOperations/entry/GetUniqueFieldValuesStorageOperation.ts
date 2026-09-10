import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntryUniqueValue,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams
} from "~/types/index.js";

export interface IGetUniqueFieldValuesStorageOperation {
    execute(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetUniqueFieldValuesParams
    ): Promise<CmsEntryUniqueValue[]>;
}

export const GetUniqueFieldValuesStorageOperation =
    createAbstraction<IGetUniqueFieldValuesStorageOperation>(
        "Cms/Entry/GetUniqueFieldValuesStorageOperation"
    );

export namespace GetUniqueFieldValuesStorageOperation {
    export type Interface = IGetUniqueFieldValuesStorageOperation;
}
