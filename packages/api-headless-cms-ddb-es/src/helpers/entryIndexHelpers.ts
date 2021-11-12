import Error from "@webiny/error";
import { CmsEntry, CmsModel, CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { CmsIndexEntry, CmsModelFieldToElasticsearchPlugin } from "~/types";
import { PluginsContainer } from "@webiny/plugins";

interface SetupEntriesIndexHelpersParams {
    plugins: PluginsContainer;
}

interface ExtractEntriesFromIndexParams extends SetupEntriesIndexHelpersParams {
    model: CmsModel;
    entries: CmsIndexEntry[];
}

interface PrepareElasticsearchDataParams extends SetupEntriesIndexHelpersParams {
    model: CmsModel;
    storageEntry: CmsEntry;
}

export const prepareEntryToIndex = (params: PrepareElasticsearchDataParams): CmsIndexEntry => {
    const { plugins, storageEntry, model } = params;
    const { fieldIndexPlugins, defaultIndexFieldPlugin, fieldTypePlugins } =
        setupEntriesIndexHelpers({ plugins });

    function getFieldIndexPlugin(fieldType: string) {
        return fieldIndexPlugins[fieldType] || defaultIndexFieldPlugin;
    }

    function getFieldTypePlugin(fieldType: string) {
        const pl = fieldTypePlugins[fieldType];
        if (pl) {
            return pl;
        }
        throw new Error(`Missing field type plugin "${fieldType}". Prepare entry for index.`);
    }

    // These objects will contain values processed by field index plugins
    const values = {};
    const rawValues = {};

    // We're only interested in current model fields.
    for (const field of model.fields) {
        if (storageEntry.values.hasOwnProperty(field.fieldId) === false) {
            continue;
        }

        const targetFieldPlugin = getFieldIndexPlugin(field.type);

        // TODO: remove this `if` once we convert this plugin to proper plugin class
        if (!targetFieldPlugin || !targetFieldPlugin.toIndex) {
            continue;
        }

        const { value, rawValue } = targetFieldPlugin.toIndex({
            plugins,
            model,
            field,
            value: storageEntry.values[field.fieldId],
            getFieldIndexPlugin,
            getFieldTypePlugin
        });

        if (typeof value !== "undefined") {
            values[field.fieldId] = value;
        }

        if (typeof rawValue !== "undefined") {
            rawValues[field.fieldId] = rawValue;
        }
    }
    return {
        ...storageEntry,
        values,
        rawValues
    } as CmsIndexEntry;
};

const setupEntriesIndexHelpers = ({
    plugins: pluginsContainer
}: SetupEntriesIndexHelpersParams) => {
    const plugins = pluginsContainer.byType<CmsModelFieldToElasticsearchPlugin>(
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
    const fieldTypePlugins: Record<string, CmsModelFieldToGraphQLPlugin> = pluginsContainer
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce((plugins, plugin) => ({ ...plugins, [plugin.fieldType]: plugin }), {});

    return {
        fieldIndexPlugins,
        defaultIndexFieldPlugin,
        fieldTypePlugins
    };
};

export const extractEntriesFromIndex = ({
    plugins,
    entries,
    model
}: ExtractEntriesFromIndexParams): CmsEntry[] => {
    const { fieldIndexPlugins, defaultIndexFieldPlugin, fieldTypePlugins } =
        setupEntriesIndexHelpers({ plugins });

    function getFieldIndexPlugin(fieldType: string) {
        return fieldIndexPlugins[fieldType] || defaultIndexFieldPlugin;
    }

    function getFieldTypePlugin(fieldType: string) {
        return fieldTypePlugins[fieldType];
    }

    const list: CmsEntry[] = [];

    for (const entry of entries) {
        // This object will contain values processed by field index plugins
        const indexValues = {};

        // We only consider fields that are present in the model
        for (const field of model.fields) {
            const fieldTypePlugin = fieldTypePlugins[field.type];
            if (!fieldTypePlugin) {
                throw new Error(
                    `Missing field type plugin "${field.type}". Extract entries from index.`
                );
            }

            const targetFieldPlugin = getFieldIndexPlugin(field.type);
            if (!targetFieldPlugin || !targetFieldPlugin.fromIndex) {
                continue;
            }
            try {
                indexValues[field.fieldId] = targetFieldPlugin.fromIndex({
                    plugins,
                    model,
                    field,
                    getFieldIndexPlugin,
                    getFieldTypePlugin,
                    value: entry.values[field.fieldId],
                    /**
                     * Possibly no rawValues so we must check for the existence of the field.
                     */
                    rawValue: entry.rawValues ? entry.rawValues[field.fieldId] : null
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
        list.push({ ...entry, values: indexValues });
    }

    return list;
};
