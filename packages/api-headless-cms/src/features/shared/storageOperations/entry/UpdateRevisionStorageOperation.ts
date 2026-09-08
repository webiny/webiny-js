import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsUpdateParams
} from "~/types/index.js";

/**
 * Writes one revision record and nothing else. Unlike `UpdateEntryStorageOperation`, it doesn't
 * copy the revision onto the entry's latest record, so editing an older revision (its note, for
 * example) can't overwrite the latest revision's values.
 */
export interface IUpdateRevisionStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ): Promise<CmsEntry<T>>;
}

export const UpdateRevisionStorageOperation = createAbstraction<IUpdateRevisionStorageOperation>(
    "Cms/Entry/UpdateRevisionStorageOperation"
);

export namespace UpdateRevisionStorageOperation {
    export type Interface = IUpdateRevisionStorageOperation;
}
