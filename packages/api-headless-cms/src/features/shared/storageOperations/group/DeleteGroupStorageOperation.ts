import { createAbstraction } from "@webiny/feature/api";
import type { CmsGroupStorageOperationsDeleteParams } from "~/types/index.js";

export interface IDeleteGroupStorageOperation {
    execute(params: CmsGroupStorageOperationsDeleteParams): Promise<void>;
}

export const DeleteGroupStorageOperation = createAbstraction<IDeleteGroupStorageOperation>(
    "Cms/Group/DeleteGroupStorageOperation"
);

export namespace DeleteGroupStorageOperation {
    export type Interface = IDeleteGroupStorageOperation;
}
