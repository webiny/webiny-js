import WebinyError from "@webiny/error";
import { StorageTransformPlugin } from "~/plugins/StorageTransformPlugin";
import { CmsContext, CmsEntry, CmsModel, CmsModelField } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";

interface GetStoragePluginFactory {
    (context: Pick<CmsContext, "plugins">): (fieldType: string) => StorageTransformPlugin<any>;
}

const getStoragePluginFactory: GetStoragePluginFactory = context => {
    let defaultStoragePlugin: StorageTransformPlugin;

    const plugins = context.plugins
        .byType<StorageTransformPlugin>(StorageTransformPlugin.type)
        // we reverse plugins because we want to get latest added only
        .reverse()
        .reduce(
            (collection, plugin) => {
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
            },
            {} as Record<string, StorageTransformPlugin>
        );

    return (fieldType: string) => {
        return plugins[fieldType] || defaultStoragePlugin;
    };
};

/**
 * This should be used when transforming the whole entry.
 */
const entryStorageTransform = async (
    context: Pick<CmsContext, "plugins">,
    model: CmsModel,
    operation: "toStorage" | "fromStorage",
    entry: CmsEntry
): Promise<CmsEntry> => {
    const getStoragePlugin = getStoragePluginFactory(context);

    const transformedValues: Record<string, any> = {};
    for (const field of model.fields) {
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
