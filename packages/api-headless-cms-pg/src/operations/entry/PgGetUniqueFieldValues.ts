import { GetUniqueFieldValuesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { EntrySearch } from "~/features/search/abstractions.js";
import type {
    CmsEntryStorageOperationsGetUniqueFieldValuesParams,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";

class PgGetUniqueFieldValuesImpl implements GetUniqueFieldValuesStorageOperation.Interface {
    public constructor(
        private readonly search: EntrySearch.Interface,
        private readonly scopeTenant: ScopeTenant.Interface
    ) {}

    public async execute(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetUniqueFieldValuesParams
    ) {
        // The search checks it too; the operation checks what its caller passed up front.
        this.scopeTenant.getId();
        return this.search.uniqueValues(model, params);
    }
}

export const PgGetUniqueFieldValues = GetUniqueFieldValuesStorageOperation.createImplementation({
    implementation: PgGetUniqueFieldValuesImpl,
    dependencies: [EntrySearch, ScopeTenant]
});
