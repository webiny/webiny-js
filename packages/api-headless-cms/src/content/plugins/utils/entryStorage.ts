import WebinyError from "@webiny/error";
import {
    CmsContentEntry,
    CmsContentModel,
    CmsContentModelField,
    CmsContext,
    CmsModelFieldToStoragePlugin
} from "../../../types";

const getStoragePlugins = (context: CmsContext): Record<string, CmsModelFieldToStoragePlugin> => {
    return (
        context.plugins
            .byType<CmsModelFieldToStoragePlugin>("cms-model-field-to-storage")
            // we reverse plugins because we want to get latest added only
            .reverse()
            .reduce((items, plugin) => {
                // either existing plugin added or plugin fieldType does not exist in current model
                // this is to iterate a bit less later
                if (items[plugin.fieldType]) {
                    return items;
                }
                items[plugin.fieldType] = plugin;
                return items;
            }, {})
    );
};

/*
 * this is a factory function that will create a mapper to transform values of fields that have
 * a plugin of "CmsModelFieldToStoragePlugin" type into something else - depending on plugin
 * the idea behind this was to introduce a compression of rich-text fields
 * but it can be used for anything (convert object to string and revert it, etc...)
 *
 * this should be used when transforming a whole entry
 */
const entryStorageTransformFactory = (
    context: CmsContext,
    model: CmsContentModel,
    operation: "toStorage" | "fromStorage"
): null | ((entry: CmsContentEntry) => Promise<CmsContentEntry>) => {
    const plugins = getStoragePlugins(context);
    // we map plugins to each field so we basically can go through plugins object
    // and iterate only those fields that have plugins
    const fieldByIdToPluginMap: Record<string, CmsModelFieldToStoragePlugin> = {};
    const modelFieldIdToFieldMap: Record<string, CmsContentModelField> = {};
    for (const field of model.fields) {
        if (!plugins[field.type]) {
            continue;
        }
        const plugin = plugins[field.type];
        if (typeof plugin[operation] !== "function") {
            throw new WebinyError(
                `Missing function "${operation}" in plugin "${plugin.name ||
                    "unknown"}" for field type "${plugin.fieldType}".`,
                "STORAGE_MAPPING_ERROR"
            );
        }
        fieldByIdToPluginMap[field.fieldId] = plugin;
        modelFieldIdToFieldMap[field.fieldId] = field;
    }
    if (Object.keys(fieldByIdToPluginMap).length === 0) {
        return null;
    }

    return async (entry: CmsContentEntry) => {
        const values: Record<string, any> = {};
        for (const fieldId in fieldByIdToPluginMap) {
            if (fieldByIdToPluginMap.hasOwnProperty(fieldId) === false || !entry.values[fieldId]) {
                continue;
            }
            const plugin = fieldByIdToPluginMap[fieldId];
            const field = modelFieldIdToFieldMap[fieldId];
            values[fieldId] = await plugin[operation]({
                model,
                entry,
                field,
                context,
                value: entry.values[fieldId]
            });
        }
        return {
            ...entry,
            values: {
                ...entry.values,
                ...values
            }
        };
    };
};

const entryFieldStorageTransformFactory = (
    context: CmsContext,
    model: CmsContentModel,
    operation: "toStorage" | "fromStorage"
) => {
    const plugins = getStoragePlugins(context);
    return async (
        entry: CmsContentEntry,
        field: CmsContentModelField,
        value: any
    ): Promise<any> => {
        const plugin = plugins[field.type];
        if (!plugin) {
            return value;
        }
        return await plugin[operation]({
            model,
            entry,
            field,
            context,
            value: entry.values[field.fieldId]
        });
    };
};
/*
 * A function that is used in crud to transform entry into the storage type
 */
export const entryToStorageTransform = async (
    context: CmsContext,
    model: CmsContentModel,
    entry: CmsContentEntry
): Promise<CmsContentEntry> => {
    const transform = entryStorageTransformFactory(context, model, "toStorage");
    if (!transform) {
        return entry;
    }
    return await transform(entry);
};
/*
 * A function that is used to transform whole entry from storage
 * This function is mostly used in crud when extracting some target entry and then need to use it further in the code
 */
export const entryFromStorageTransform = async (
    context: CmsContext,
    model: CmsContentModel,
    entry?: CmsContentEntry & Record<string, any>
): Promise<CmsContentEntry> => {
    if (!entry) {
        return null;
    }
    const transform = entryStorageTransformFactory(context, model, "fromStorage");
    if (!transform) {
        return entry;
    }
    return await transform(entry);
};

interface EntryFieldFromStorageTransformArgs {
    context: CmsContext;
    model: CmsContentModel;
    entry: CmsContentEntry & Record<string, any>;
    field: CmsContentModelField;
    value: any;
}
/*
 * A function that is used to transform a single field from storage
 */
export const entryFieldFromStorageTransform = async (
    args: EntryFieldFromStorageTransformArgs
): Promise<any> => {
    const { context, model, entry, field, value } = args;
    const transform = entryFieldStorageTransformFactory(context, model, "fromStorage");
    if (!transform) {
        return entry;
    }
    return await transform(entry, field, value);
};
