import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsCreateRevisionFromParams
} from "~/types/types.js";

export interface ICreateEntryRevisionFromStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams<T>
    ): Promise<CmsEntry<T>>;
}

export const CreateEntryRevisionFromStorageOperation =
    createAbstraction<ICreateEntryRevisionFromStorageOperation>(
        "Cms/Entry/CreateEntryRevisionFromStorageOperation"
    );

export namespace CreateEntryRevisionFromStorageOperation {
    export type Interface = ICreateEntryRevisionFromStorageOperation;
}
