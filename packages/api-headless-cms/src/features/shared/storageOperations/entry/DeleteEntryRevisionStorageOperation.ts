import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsDeleteRevisionParams
} from "~/types/types.js";

export interface IDeleteEntryRevisionStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams<T>
    ): Promise<void>;
}

export const DeleteEntryRevisionStorageOperation =
    createAbstraction<IDeleteEntryRevisionStorageOperation>(
        "Cms/Entry/DeleteEntryRevisionStorageOperation"
    );

export namespace DeleteEntryRevisionStorageOperation {
    export type Interface = IDeleteEntryRevisionStorageOperation;
}
