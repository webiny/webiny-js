import type {
    CmsEntry,
    CmsEntryUniqueValue,
    CmsEntryValues,
    CmsModel,
    CmsModelField,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { Container } from "@webiny/di";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";
import type { StorageTransformRegistry } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import type { FilterItemFromStorage } from "../filtering/fields/types.js";

/* Creates a lazy-cached getter for the storage representation of a CMS model. */
export const createStorageModelAccessor = (container: Container) => {
    let cached: CmsStorageModelProvider.Interface | undefined;

    const getProvider = () => {
        if (!cached) {
            cached = container.resolve(CmsStorageModelProvider);
        }
        return cached;
    };

    const getModel = <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel
    ): StorageOperationsCmsModel<T> => {
        return getProvider().getModel<T>(model);
    };

    return { getModel };
};

/* Creates a fromStorage transform callable for a given model. */
export const createStorageTransformCallable = (
    storageTransformRegistry: StorageTransformRegistry.Interface,
    model: StorageOperationsCmsModel
): FilterItemFromStorage => {
    return async (field: CmsModelField, value: unknown) => {
        const fieldType = getBaseFieldType(field);
        const storageTransform = storageTransformRegistry.get(fieldType);

        if (!storageTransform) {
            return value;
        }

        const result = await storageTransform.fromStorage({
            model,
            field,
            value,
            getStorageTransform(ft: string) {
                return storageTransformRegistry.get(ft) || storageTransformRegistry.get("*")!;
            }
        });

        return result;
    };
};

/* Aggregates unique values for a given field across a list of CMS entries. */
export const aggregateUniqueFieldValues = <T extends CmsEntryValues = CmsEntryValues>(
    items: CmsEntry<T>[],
    fieldId: string
): CmsEntryUniqueValue[] => {
    const result: Record<string, CmsEntryUniqueValue> = {};

    for (const item of items) {
        const fieldValue = item.values[fieldId] as string[] | string | undefined;

        if (fieldValue == null) {
            continue;
        }

        const values = Array.isArray(fieldValue) ? fieldValue : [fieldValue];

        if (values.length === 0) {
            continue;
        }

        for (const value of values) {
            result[value] = {
                value,
                count: (result[value]?.count || 0) + 1
            };
        }
    }

    return Object.values(result)
        .sort((a, b) => (a.value > b.value ? 1 : b.value > a.value ? -1 : 0))
        .sort((a, b) => b.count - a.count);
};
