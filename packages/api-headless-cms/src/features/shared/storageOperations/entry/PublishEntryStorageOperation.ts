import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsPublishParams
} from "~/types/index.js";

export interface IPublishEntryStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsPublishParams<T>
    ): Promise<CmsEntry<T>>;
}

export const PublishEntryStorageOperation = createAbstraction<IPublishEntryStorageOperation>(
    "Cms/Entry/PublishEntryStorageOperation"
);

export namespace PublishEntryStorageOperation {
    export type Interface = IPublishEntryStorageOperation;
}
