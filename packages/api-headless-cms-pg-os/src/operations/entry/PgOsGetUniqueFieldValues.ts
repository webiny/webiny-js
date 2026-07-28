import type {
    CmsModel,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetUniqueFieldValuesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.js";
import { EntrySearchOperations } from "./abstractions/EntrySearchOperations.js";

class PgOsGetUniqueFieldValuesImpl implements GetUniqueFieldValuesStorageOperation.Interface {
    constructor(private ops: EntrySearchOperations.Interface) {}

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetUniqueFieldValuesParams) {
        return this.ops.getUniqueFieldValues(model, params);
    }
}

export const PgOsGetUniqueFieldValues = createImplementation({
    abstraction: GetUniqueFieldValuesStorageOperation,
    implementation: PgOsGetUniqueFieldValuesImpl,
    dependencies: [EntrySearchOperations]
});
