import lodashGet from "lodash.get";
import lodashSet from "lodash.set";
import Error from "@webiny/error";
import {
    CmsContentEntry,
    CmsContentModel,
    CmsContext,
    CmsModelFieldToGraphQLPlugin
} from "@webiny/api-headless-cms/types";
import { CmsContentIndexEntry, CmsModelFieldToElasticsearchPlugin } from "~/types";

interface SetupEntriesIndexHelpersArgs {
    context: CmsContext;
}

interface ExtractEntriesFromIndexArgs extends SetupEntriesIndexHelpersArgs {
    model: CmsContentModel;
    entries: CmsContentIndexEntry[];
}

interface PrepareElasticsearchDataArgs extends SetupEntriesIndexHelpersArgs {
    model: CmsContentModel;
    storageEntry: CmsContentEntry;
    originalEntry: CmsContentEntry;
}

export const prepareEntryToIndex = (args: PrepareElasticsearchDataArgs): CmsContentIndexEntry => {
    const { context, storageEntry, model } = args;
    const {
        fieldIndexPlugins,
        defaultIndexFieldPlugin,
        fieldTypePlugins
    } = setupEntriesIndexHelpers({ context });

    function getFieldIndexPlugin(fieldType: string) {
        return fieldIndexPlugins[fieldType];
    }

    function getValue(fieldPath: string) {
        return lodashGet(storageEntry.values, fieldPath);
    }

    // These objects will contain values processed by field index plugins
    const indexValues = {};
    const indexRawValues = {};

    // We're only interested in current model fields.
    for (const field of model.fields) {
        if (storageEntry.values.hasOwnProperty(field.fieldId) === false) {
            continue;
        }

        const fieldTypePlugin = fieldTypePlugins[field.type];
        if (!fieldTypePlugin) {
            throw new Error(`Missing field type plugin "${field.type}".`);
        }

        const targetFieldPlugin = fieldIndexPlugins[field.type] || defaultIndexFieldPlugin;
        /**
         * We decided to use only the last registered plugin for the given field type.
         */
        if (targetFieldPlugin && targetFieldPlugin.toIndex) {
            const { values = {}, rawValues = {} } = targetFieldPlugin.toIndex({
                context,
                model,
                field,
                getValue,
                getFieldIndexPlugin,
                fieldPath: field.fieldId
            });

            Object.keys(values).forEach(key => {
                lodashSet(indexValues, key, values[key]);
            });

            Object.keys(rawValues).forEach(key => {
                lodashSet(indexRawValues, key, rawValues[key]);
            });
        }
    }
    return {
        ...storageEntry,
        values: indexValues,
        rawValues: indexRawValues
    } as CmsContentIndexEntry;
};

const setupEntriesIndexHelpers = ({ context }: SetupEntriesIndexHelpersArgs) => {
    const plugins = context.plugins.byType<CmsModelFieldToElasticsearchPlugin>(
        "cms-model-field-to-elastic-search"
    );

    const fieldIndexPlugins: Record<string, CmsModelFieldToElasticsearchPlugin> = {};
    for (const plugin of plugins.reverse()) {
        if (fieldIndexPlugins[plugin.fieldType]) {
            continue;
        }
        fieldIndexPlugins[plugin.fieldType] = plugin;
    }
    // we will use this plugin if no targeted plugin found
    const defaultIndexFieldPlugin = plugins.find(plugin => plugin.fieldType === "*");

    // CmsModelFieldToGraphQLPlugin plugins
    const fieldTypePlugins: Record<string, CmsModelFieldToGraphQLPlugin> = context.plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce((plugins, plugin) => ({ ...plugins, [plugin.fieldType]: plugin }), {});

    return {
        fieldIndexPlugins,
        defaultIndexFieldPlugin,
        fieldTypePlugins
    };
};

export const extractEntriesFromIndex = ({
    context,
    entries,
    model
}: ExtractEntriesFromIndexArgs): CmsContentEntry[] => {
    const {
        fieldIndexPlugins,
        defaultIndexFieldPlugin,
        fieldTypePlugins
    } = setupEntriesIndexHelpers({ context });

    function getFieldIndexPlugin(fieldType: string) {
        return fieldIndexPlugins[fieldType];
    }

    const list: CmsContentEntry[] = [];
    
    for (const entry of entries) {
        // This object will contain values processed by field index plugins
        const indexValues = {};

        function getValue(fieldPath: string) {
            return lodashGet(entry.values, fieldPath);
        }

        function getRawValue(fieldPath: string) {
            return lodashGet(entry.rawValues, fieldPath);
        }

        // We only consider fields that are present in the model
        for (const field of model.fields) {
            const fieldTypePlugin = fieldTypePlugins[field.type];
            if (!fieldTypePlugin) {
                throw new Error(`Missing field type plugin "${field.type}".`);
            }

            const targetFieldPlugin = fieldIndexPlugins[field.type] || defaultIndexFieldPlugin;
            if (targetFieldPlugin && targetFieldPlugin.fromIndex) {
                try {
                    const { values } = targetFieldPlugin.fromIndex({
                        context,
                        model,
                        field,
                        fieldPath: field.fieldId,
                        getFieldIndexPlugin,
                        getValue,
                        getRawValue
                    });

                    Object.keys(values).forEach(key => {
                        lodashSet(indexValues, key, values[key]);
                    });
                } catch (ex) {
                    throw new Error(
                        ex.message || "Could not transform entry field from index.",
                        ex.code || "FIELD_FROM_INDEX_ERROR",
                        {
                            field,
                            entry
                        }
                    );
                }
            }
        }
        list.push({ ...entry, values: indexValues });
    }

    return list;
};
