import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetParams
} from "@webiny/api-headless-cms/types/index.js";
import { GetEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntryStorageOperation.js";
import { EntrySearchOperations } from "./abstractions/EntrySearchOperations.js";

class PgOsGetEntryImpl implements GetEntryStorageOperation.Interface {
    constructor(private ops: EntrySearchOperations.Interface) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ) {
        return this.ops.get<T>(model, params);
    }
}

export const PgOsGetEntry = GetEntryStorageOperation.createImplementation({
    implementation: PgOsGetEntryImpl,
    dependencies: [EntrySearchOperations]
});
