import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel, CmsEntryStorageOperationsDeleteEntriesParams } from "~/types/types.js";

export interface IDeleteMultipleEntriesStorageOperation {
    execute(model: CmsModel, params: CmsEntryStorageOperationsDeleteEntriesParams): Promise<void>;
}

export const DeleteMultipleEntriesStorageOperation =
    createAbstraction<IDeleteMultipleEntriesStorageOperation>(
        "Cms/Entry/DeleteMultipleEntriesStorageOperation"
    );

export namespace DeleteMultipleEntriesStorageOperation {
    export type Interface = IDeleteMultipleEntriesStorageOperation;
}
