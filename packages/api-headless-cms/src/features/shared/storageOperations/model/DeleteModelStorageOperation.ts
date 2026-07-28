import { createAbstraction } from "@webiny/feature/api";
import type { CmsModelStorageOperationsDeleteParams } from "~/types/index.js";

export interface IDeleteModelStorageOperation {
    execute(params: CmsModelStorageOperationsDeleteParams): Promise<void>;
}

export const DeleteModelStorageOperation = createAbstraction<IDeleteModelStorageOperation>(
    "Cms/Model/DeleteModelStorageOperation"
);

export namespace DeleteModelStorageOperation {
    export type Interface = IDeleteModelStorageOperation;
}
