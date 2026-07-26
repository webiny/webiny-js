import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsUnpublishParams
} from "~/types/types.js";

export interface IUnpublishEntryStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUnpublishParams<T>
    ): Promise<CmsEntry<T>>;
}

export const UnpublishEntryStorageOperation = createAbstraction<IUnpublishEntryStorageOperation>(
    "Cms/Entry/UnpublishEntryStorageOperation"
);

export namespace UnpublishEntryStorageOperation {
    export type Interface = IUnpublishEntryStorageOperation;
}
