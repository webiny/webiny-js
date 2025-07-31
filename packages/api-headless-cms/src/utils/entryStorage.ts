import WebinyError from "@webiny/error";
import { StorageTransformPlugin } from "~/plugins/StorageTransformPlugin";
import type { CmsContext, CmsEntry, CmsEntryValues, CmsModel, CmsModelField } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";

export interface GetStoragePluginFactory {
    (context: Pick<CmsContext, "plugins">): (fieldType: string) => StorageTransformPlugin<any>;
}

export const getStoragePluginFactory: GetStoragePluginFactory = context => {
    let defaultStoragePlugin: StorageTransformPlugin;

    const plugins = context.plugins
        .byType<StorageTransformPlugin>(StorageTransformPlugin.type)
        // we reverse plugins because we want to get latest added only
        .reverse()
        .reduce((collection, plugin) => {
            /**
             * Check if it's a default plugin and set it - always override the previous one.
             */
            if (plugin.fieldType === "*") {
                defaultStoragePlugin = plugin;
                return collection;
            }

            /**
             * We will just set the plugin for given type.
             * The last one will override existing one - so users can override our default ones.
             */
            collection[plugin.fieldType] = plugin;

            return collection;
        }, {} as Record<string, StorageTransformPlugin>);

    return (fieldType: string) => {
        return plugins[fieldType] || defaultStoragePlugin;
    };
};

const doNotTouchProperty = Symbol("__DO_NOT_TOUCH_AS_WE_USE_IT_TO_SKIP_UNNECESSARY_OPERATIONS");

/**
 * This should be used when transforming the whole entry.
 */
const entryStorageTransform = async (
    context: Pick<CmsContext, "plugins">,
    model: CmsModel,
    operation: "toStorage" | "fromStorage",
    entry: CmsEntry
): Promise<CmsEntry> => {
    /**
     * We use this property to skip unnecessary operations.
     */
    // @ts-expect-error
    if (entry[doNotTouchProperty] === operation) {
        return entry;
    }

    const getStoragePlugin = getStoragePluginFactory(context);

    const transformedValues: Record<string, any> = {};
    for (const field of model.fields) {
        /**
         * We can safely skip fields that are not present in the entry values.
         */
        if (entry.values.hasOwnProperty(field.fieldId) === false) {
            continue;
        }
        const value = entry.values[field.fieldId];

        const baseType = getBaseFieldType(field);
        const plugin = getStoragePlugin(baseType);
        // TODO: remove this once plugins are converted into classes
        if (typeof plugin[operation] !== "function") {
            throw new WebinyError(
                `Missing "${operation}" function in storage plugin "${plugin.name}" for field type "${baseType}"`
            );
        }

        transformedValues[field.fieldId] = await plugin[operation]({
            plugins: context.plugins,
            model,
            field,
            value,
            getStoragePlugin
        });
    }

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
    context: Pick<CmsContext, "plugins">,
    model: CmsModel,
    entry: CmsEntry
): Promise<CmsEntry> => {
    return entryStorageTransform(context, model, "toStorage", entry);
};

/**
 * A function that is used to transform the whole entry from storage into its native form.
 */
export const entryFromStorageTransform = async (
    context: Pick<CmsContext, "plugins">,
    model: CmsModel,
    entry: CmsEntry
): Promise<CmsEntry> => {
    return entryStorageTransform(context, model, "fromStorage", entry);
};

interface EntryFieldFromStorageTransformParams {
    context: Pick<CmsContext, "plugins">;
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
    const getStoragePlugin = getStoragePluginFactory(context);

    const baseType = getBaseFieldType(field);
    const plugin = getStoragePlugin(baseType);

    // TODO: remove this once plugins are converted into classes
    if (typeof plugin.fromStorage !== "function") {
        throw new WebinyError(
            `Missing "fromStorage" function in storage plugin "${plugin.name}" for field type "${baseType}"`
        );
    }

    return plugin.fromStorage({
        plugins: context.plugins,
        model,
        field,
        value,
        getStoragePlugin
    });
};

export interface ICreateTransformEntryCallable {
    context: Pick<CmsContext, "plugins">;
}

export interface ITransformEntryCallable<T extends CmsEntryValues = CmsEntryValues> {
    (model: CmsModel, entry: CmsEntry): Promise<CmsEntry<T>>;
}

export const createTransformEntryCallable = (
    params: ICreateTransformEntryCallable
): ITransformEntryCallable => {
    const { context } = params;

    return async (model, entry) => {
        return entryFromStorageTransform(context, model, entry);
    };
};
