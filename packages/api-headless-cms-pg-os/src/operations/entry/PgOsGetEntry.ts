import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsGetParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
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

export const PgOsGetEntry = createImplementation({
    abstraction: GetEntryStorageOperation,
    implementation: PgOsGetEntryImpl,
    dependencies: [EntrySearchOperations]
});
