import { createAbstraction } from "@webiny/feature/api";
import type { CmsGroupStorageOperationsUpdateParams } from "~/types/index.js";

export interface IUpdateGroupStorageOperation {
    execute(params: CmsGroupStorageOperationsUpdateParams): Promise<void>;
}

export const UpdateGroupStorageOperation = createAbstraction<IUpdateGroupStorageOperation>(
    "Cms/Group/UpdateGroupStorageOperation"
);

export namespace UpdateGroupStorageOperation {
    export type Interface = IUpdateGroupStorageOperation;
}
