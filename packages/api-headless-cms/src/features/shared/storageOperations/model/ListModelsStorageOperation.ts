import { createAbstraction } from "@webiny/feature/api";
import type { StorageCmsModel, CmsModelStorageOperationsListParams } from "~/types/index.js";

export interface IListModelsStorageOperation {
    execute(params: CmsModelStorageOperationsListParams): Promise<StorageCmsModel[]>;
}

export const ListModelsStorageOperation = createAbstraction<IListModelsStorageOperation>(
    "Cms/Model/ListModelsStorageOperation"
);

export namespace ListModelsStorageOperation {
    export type Interface = IListModelsStorageOperation;
}
