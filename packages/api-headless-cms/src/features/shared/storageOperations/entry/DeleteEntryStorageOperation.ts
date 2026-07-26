import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel, CmsEntryStorageOperationsDeleteParams } from "~/types/types.js";

export interface IDeleteEntryStorageOperation {
    execute(model: CmsModel, params: CmsEntryStorageOperationsDeleteParams): Promise<void>;
}

export const DeleteEntryStorageOperation = createAbstraction<IDeleteEntryStorageOperation>(
    "Cms/Entry/DeleteEntryStorageOperation"
);

export namespace DeleteEntryStorageOperation {
    export type Interface = IDeleteEntryStorageOperation;
}
