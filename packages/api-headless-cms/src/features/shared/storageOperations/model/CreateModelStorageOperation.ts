import { createAbstraction } from "@webiny/feature/api";
import type { StorageCmsModel, CmsModelStorageOperationsCreateParams } from "~/types/index.js";

export interface ICreateModelStorageOperation {
    execute(params: CmsModelStorageOperationsCreateParams): Promise<StorageCmsModel>;
}

export const CreateModelStorageOperation = createAbstraction<ICreateModelStorageOperation>(
    "Cms/Model/CreateModelStorageOperation"
);

export namespace CreateModelStorageOperation {
    export type Interface = ICreateModelStorageOperation;
}
