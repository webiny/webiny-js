import { createAbstraction } from "@webiny/feature/api";
import type { CmsGroup, CmsGroupStorageOperationsGetParams } from "~/types/index.js";

export interface IGetGroupStorageOperation {
    execute(params: CmsGroupStorageOperationsGetParams): Promise<CmsGroup | null>;
}

export const GetGroupStorageOperation = createAbstraction<IGetGroupStorageOperation>(
    "Cms/Group/GetGroupStorageOperation"
);

export namespace GetGroupStorageOperation {
    export type Interface = IGetGroupStorageOperation;
}
