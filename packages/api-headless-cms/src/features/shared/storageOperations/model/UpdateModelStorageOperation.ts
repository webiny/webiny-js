import { createAbstraction } from "@webiny/feature/api";
import type { StorageCmsModel, CmsModelStorageOperationsUpdateParams } from "~/types/index.js";

export interface IUpdateModelStorageOperation {
    execute(params: CmsModelStorageOperationsUpdateParams): Promise<StorageCmsModel>;
}

export const UpdateModelStorageOperation = createAbstraction<IUpdateModelStorageOperation>(
    "Cms/Model/UpdateModelStorageOperation"
);

export namespace UpdateModelStorageOperation {
    export type Interface = IUpdateModelStorageOperation;
}
