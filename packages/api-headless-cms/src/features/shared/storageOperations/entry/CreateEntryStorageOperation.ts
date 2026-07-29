import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsCreateParams
} from "~/types/index.js";

export interface ICreateEntryStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateParams<T>
    ): Promise<CmsEntry<T>>;
}

export const CreateEntryStorageOperation = createAbstraction<ICreateEntryStorageOperation>(
    "Cms/Entry/CreateEntryStorageOperation"
);

export namespace CreateEntryStorageOperation {
    export type Interface = ICreateEntryStorageOperation;
}
