import WebinyError from "@webiny/error";
import { StorageTransformPlugin } from "~/plugins/StorageTransformPlugin";
import { CmsEntry, CmsModel, CmsModelField, CmsContext } from "~/types";

interface GetStoragePluginFactory {
    (context: CmsContext): (fieldType: string) => StorageTransformPlugin<any>;
}

const getStoragePluginFactory: GetStoragePluginFactory = context => {
    let defaultStoragePlugin: StorageTransformPlugin;

    const plugins = context.plugins
        .byType<StorageTransformPlugin>(StorageTransformPlugin.type)
        // we reverse plugins because we want to get latest added only
        .reverse()
        .reduce((collection, plugin) => {
            // check if it's a default plugin
            if (plugin.fieldType === "*" && !defaultStoragePlugin) {
                defaultStoragePlugin = plugin;
                return collection;
            }

            /**
             * either existing plugin added or plugin fieldType does not exist in current model
             * this is to iterate a bit less later
             */
            if (!collection[plugin.fieldType]) {
                collection[plugin.fieldType] = plugin;
            }

            return collection;
        }, {} as Record<string, StorageTransformPlugin>);

    return (fieldType: string) => {
        return plugins[fieldType] || defaultStoragePlugin;
    };
};

/**
 * This should be used when transforming the whole entry.
 */
const entryStorageTransform = async (
    context: CmsContext,
    model: CmsModel,
    operation: "toStorage" | "fromStorage",
    entry: CmsEntry
): Promise<CmsEntry> => {
    const getStoragePlugin = getStoragePluginFactory(context);

    const transformedValues: Record<string, any> = {};
    for (const field of model.fields) {
        const plugin = getStoragePlugin(field.type);
        // TODO: remove this once plugins are converted into classes
        if (typeof plugin[operation] !== "function") {
            throw new WebinyError(
                `Missing "${operation}" function in storage plugin "${plugin.name}" for field type "${field.type}"`
            );
        }

        transformedValues[field.fieldId] = await plugin[operation]({
            plugins: context.plugins,
            model,
            field,
            value: entry.values[field.fieldId],
            getStoragePlugin
        });
    }

    return { ...entry, values: transformedValues };
};

/**
 * A function that is used in crud to transform entry into the storage type.
 */
export const entryToStorageTransform = async (
    context: CmsContext,
    model: CmsModel,
    entry: CmsEntry
): Promise<CmsEntry> => {
    return entryStorageTransform(context, model, "toStorage", entry);
};

/**
 * A function that is used to transform the whole entry from storage into its native form.
 */
export const entryFromStorageTransform = async (
    context: CmsContext,
    model: CmsModel,
    entry: CmsEntry
): Promise<CmsEntry> => {
    return entryStorageTransform(context, model, "fromStorage", entry);
};

interface EntryFieldFromStorageTransformParams {
    context: CmsContext;
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

    const plugin = getStoragePlugin(field.type);

    // TODO: remove this once plugins are converted into classes
    if (typeof plugin.fromStorage !== "function") {
        throw new WebinyError(
            `Missing "fromStorage" function in storage plugin "${plugin.name}" for field type "${field.type}"`
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
