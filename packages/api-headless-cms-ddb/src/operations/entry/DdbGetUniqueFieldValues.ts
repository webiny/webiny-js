import WebinyError from "@webiny/error";
import type {
    CmsModel,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams
} from "@webiny/api-headless-cms/types/index.js";
import { createImplementation } from "@webiny/feature/api";
import { GetUniqueFieldValuesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.js";
import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { aggregateUniqueFieldValues } from "@webiny/api-headless-cms-storage";

const MAX_LIST_LIMIT = 1000000;

class DdbGetUniqueFieldValuesImpl implements GetUniqueFieldValuesStorageOperation.Interface {
    constructor(private listEntries: ListEntriesStorageOperation.Interface) {}

    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetUniqueFieldValuesParams) {
        const { where, fieldId } = params;

        const field = model.fields.find(f => f.fieldId === fieldId);
        if (!field) {
            throw new WebinyError(
                `Could not find field with given "fieldId" value.`,
                "FIELD_NOT_FOUND",
                { fieldId }
            );
        }

        const { items } = await this.listEntries.execute(model, {
            where,
            limit: MAX_LIST_LIMIT
        });

        return aggregateUniqueFieldValues(items, field.fieldId);
    }
}

export const DdbGetUniqueFieldValues = createImplementation({
    abstraction: GetUniqueFieldValuesStorageOperation,
    implementation: DdbGetUniqueFieldValuesImpl,
    dependencies: [ListEntriesStorageOperation]
});
