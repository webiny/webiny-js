import { GetEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntryStorageOperation.js";
import { EntrySearch } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsGetParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";

class PgGetEntryImpl implements GetEntryStorageOperation.Interface {
    public constructor(private readonly search: EntrySearch.Interface) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ) {
        const { items } = await this.search.list<T>(model, { ...params, limit: 1 });
        return items.shift() || null;
    }
}

export const PgGetEntry = GetEntryStorageOperation.createImplementation({
    implementation: PgGetEntryImpl,
    dependencies: [EntrySearch]
});
