import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsListParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { EntrySearchOperations } from "./abstractions/EntrySearchOperations.js";

class PgOsListEntriesImpl implements ListEntriesStorageOperation.Interface {
    constructor(private ops: EntrySearchOperations.Interface) {}

    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) {
        return this.ops.list<T>(model, params);
    }
}

export const PgOsListEntries = createImplementation({
    abstraction: ListEntriesStorageOperation,
    implementation: PgOsListEntriesImpl,
    dependencies: [EntrySearchOperations]
});
