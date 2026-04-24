import type {
    CmsContext,
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsModelField
} from "~/types/index.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";
import { StorageTransform, StorageTransformRegistry } from "~/features/storage/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface GetStorageTransformFactory {
    (context: Pick<CmsContext, "container">): (fieldType: string) => StorageTransform.Interface;
}

export const getStorageTransformFactory: GetStorageTransformFactory = context => {
    const registry = context.container.resolve(StorageTransformRegistry);

    const result: GenericRecord<string, StorageTransform.Interface> = {};
    let defaultStorageTransform: StorageTransform.Interface;

    const storageTransforms = registry.getAll().toReversed();

    for (const storageTransform of storageTransforms) {
        if (storageTransform.fieldType === "*") {
            defaultStorageTransform = storageTransform;
        }
        result[storageTransform.fieldType] = storageTransform;
    }

    return (type: string) => {
        const fieldType = getBaseFieldType({
            type
        });
        return result[fieldType] || defaultStorageTransform;
    };
};

const doNotTouchProperty = Symbol("__DO_NOT_TOUCH_AS_WE_USE_IT_TO_SKIP_UNNECESSARY_OPERATIONS");

/**
 * This should be used when transforming the whole entry.
 */
const entryStorageTransform = async <T extends CmsEntryValues = CmsEntryValues>(
    context: Pick<CmsContext, "container">,
    model: CmsModel,
    operation: "toStorage" | "fromStorage",
    entry: CmsEntry<T>
): Promise<CmsEntry<T>> => {
    /**
     * We use this property to skip unnecessary operations.
     */
    // @ts-expect-error
    if (entry[doNotTouchProperty] === operation) {
        return entry;
    }

    const getStorageTransform = getStorageTransformFactory(context);

    const fieldValues = model.fields
        .filter(field => {
            return entry.values.hasOwnProperty(field.fieldId);
        })
        .map(async field => {
            const key = field.fieldId as keyof T;
            const value = entry.values[key];
            const baseType = getBaseFieldType(field);
            const storageTransform = getStorageTransform(baseType);
            const transformed = await storageTransform[operation]({
                model,
                field,
                value,
                getStorageTransform
            });
            return [key, transformed] as const;
        });

    const results = await Promise.all(fieldValues);
    const transformedValues = Object.fromEntries(results) as T;

    const result = {
        ...entry,
        values: transformedValues
    };
    /**
     * We need to assign the variable so that we can skip unnecessary operations next time.
     */
    Object.defineProperty(result, doNotTouchProperty, {
        enumerable: false,
        value: operation,
        configurable: true
    });

    return result;
};

/**
 * A function that is used in crud to transform entry into the storage type.
 */
export const entryToStorageTransform = async (
    context: Pick<CmsContext, "container">,
    model: CmsModel,
    entry: CmsEntry
): Promise<CmsEntry> => {
    return entryStorageTransform(context, model, "toStorage", entry);
};

/**
 * A function that is used to transform the whole entry from storage into its native form.
 */
export const entryFromStorageTransform = async (
    context: Pick<CmsContext, "container">,
    model: CmsModel,
    entry: CmsEntry
): Promise<CmsEntry> => {
    return entryStorageTransform(context, model, "fromStorage", entry);
};

interface EntryFieldFromStorageTransformParams {
    context: Pick<CmsContext, "container">;
    model: CmsModel;
    field: CmsModelField;
    value: any;
}
/*
 * A function that is used to transform a single field from storage
 */
export const entryFieldFromStorageTransform = async <T = any>(
    params: EntryFieldFromStorageTransformParams
): Promise<T> => {
    const { context, model, field, value } = params;
    const getStorageTransform = getStorageTransformFactory(context);

    const baseType = getBaseFieldType(field);
    const storageTransform = getStorageTransform(baseType);

    return storageTransform.fromStorage({
        model,
        field,
        value,
        getStorageTransform
    });
};
