import { GetUniqueFieldValuesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.js";
import { EntrySearch } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsGetUniqueFieldValuesParams,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";

class PgGetUniqueFieldValuesImpl implements GetUniqueFieldValuesStorageOperation.Interface {
    public constructor(private readonly search: EntrySearch.Interface) {}

    public execute(model: CmsModel, params: CmsEntryStorageOperationsGetUniqueFieldValuesParams) {
        return this.search.uniqueValues(model, params);
    }
}

export const PgGetUniqueFieldValues = GetUniqueFieldValuesStorageOperation.createImplementation({
    implementation: PgGetUniqueFieldValuesImpl,
    dependencies: [EntrySearch]
});
