import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { EntrySearch } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsListParams,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";

class PgListEntriesImpl implements ListEntriesStorageOperation.Interface {
    public constructor(
        private readonly search: EntrySearch.Interface,
        private readonly scopeTenant: ScopeTenant.Interface
    ) {}

    public async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) {
        // The search checks it too; the operation checks what its caller passed up front.
        this.scopeTenant.getId(model.tenant);
        return this.search.list<T>(model, params);
    }
}

export const PgListEntries = ListEntriesStorageOperation.createImplementation({
    implementation: PgListEntriesImpl,
    dependencies: [EntrySearch, ScopeTenant]
});
