import { createAbstraction } from "@webiny/feature/api";
import type { StorageCmsModel, CmsModelStorageOperationsGetParams } from "~/types/index.js";

export interface IGetModelStorageOperation {
    execute(params: CmsModelStorageOperationsGetParams): Promise<StorageCmsModel | null>;
}

export const GetModelStorageOperation = createAbstraction<IGetModelStorageOperation>(
    "Cms/Model/GetModelStorageOperation"
);

export namespace GetModelStorageOperation {
    export type Interface = IGetModelStorageOperation;
}
