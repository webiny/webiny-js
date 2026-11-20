import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { EntrySearch } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsListParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";

class PgListEntriesImpl implements ListEntriesStorageOperation.Interface {
    public constructor(private readonly search: EntrySearch.Interface) {}

    public execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) {
        return this.search.list<T>(model, params);
    }
}

export const PgListEntries = ListEntriesStorageOperation.createImplementation({
    implementation: PgListEntriesImpl,
    dependencies: [EntrySearch]
});
