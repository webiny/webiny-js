import { createAbstraction } from "@webiny/feature/api";
import type { CmsGroupStorageOperationsCreateParams } from "~/types/index.js";

export interface ICreateGroupStorageOperation {
    execute(params: CmsGroupStorageOperationsCreateParams): Promise<void>;
}

export const CreateGroupStorageOperation = createAbstraction<ICreateGroupStorageOperation>(
    "Cms/Group/CreateGroupStorageOperation"
);

export namespace CreateGroupStorageOperation {
    export type Interface = ICreateGroupStorageOperation;
}
