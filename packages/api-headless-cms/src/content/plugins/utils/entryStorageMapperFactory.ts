import {
    CmsContentEntryType,
    CmsContentModelFieldType,
    CmsContentModelType,
    CmsContext,
    CmsModelFieldToStoragePlugin
} from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

export const entryToStorageMapperFactory = (context: CmsContext, model: CmsContentModelType) => {
    return entryStorageMapperFactory(context, model, "toStorage");
};
export const entryFromStorageMapperFactory = (context: CmsContext, model: CmsContentModelType) => {
    return entryStorageMapperFactory(context, model, "fromStorage");
};
/*
 * this is a factory function that will create a mapper to transform values of fields that have
 * a plugin of "CmsModelFieldToStoragePlugin" type into something else - depending on plugin
 * the idea behind this was to introduce a compression of rich-text fields
 * but it can be used for anything (convert object to string and revert it, etc...)
 */
export const entryStorageMapperFactory = (
    context: CmsContext,
    model: CmsContentModelType,
    operation: "toStorage" | "fromStorage"
): null | ((entry: CmsContentEntryType) => Promise<CmsContentEntryType>) => {
    const plugins: Record<string, CmsModelFieldToStoragePlugin> = context.plugins
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
        }, {});

    // we map plugins to each field so we basically can go through plugins object
    // and iterate only those fields that have plugins
    const fieldByIdToPluginMap: Record<string, CmsModelFieldToStoragePlugin> = {};
    const modelFieldIdToFieldMap: Record<string, CmsContentModelFieldType> = {};
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

    return async (entry: CmsContentEntryType) => {
        const values: Record<string, any> = {};
        for (const fieldId in fieldByIdToPluginMap) {
            if (fieldByIdToPluginMap.hasOwnProperty(fieldId) === false || !entry.values[fieldId]) {
                continue;
            }
            const plugin = fieldByIdToPluginMap[fieldId];
            const field = modelFieldIdToFieldMap[fieldId];
            values[fieldId] = await plugin[operation]({
                field,
                context,
                model,
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

export const entryFieldFromStorage = async (
    context: CmsContext,
    model: CmsContentModelType,
    field: CmsContentModelFieldType,
    value: any
) => {
    const fromStorage = entryFromStorageMapperFactory(context, model);
    if (!fromStorage) {
        return value;
    }

    // Storage transformers are optimized for bulk processing so we need to pass a partial
    // entry object to it. We get a transformed entry back.
    const transformedEntry = await fromStorage(({
        values: {
            [field.fieldId]: value
        }
    } as unknown) as CmsContentEntryType);

    return transformedEntry.values[field.fieldId];
};
