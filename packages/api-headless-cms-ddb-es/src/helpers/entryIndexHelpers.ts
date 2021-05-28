import lodashCloneDeep from "lodash.clonedeep";
import Error from "@webiny/error";
import {
    CmsContentEntry,
    CmsContentModel,
    CmsContentModelField,
    CmsContext,
    CmsModelFieldToGraphQLPlugin
} from "@webiny/api-headless-cms/types";
import { CmsContentIndexEntry, CmsModelFieldToElasticsearchPlugin } from "../types";
import WebinyError from "@webiny/error";

interface SetupEntriesIndexHelpersArgs {
    context: CmsContext;
    model: CmsContentModel;
}

interface ExtractEntriesFromIndexArgs extends SetupEntriesIndexHelpersArgs {
    entries: CmsContentIndexEntry[];
}

interface PrepareElasticsearchDataArgs extends SetupEntriesIndexHelpersArgs {
    storageEntry: CmsContentEntry;
    originalEntry: CmsContentEntry;
}

export const prepareEntryToIndex = (args: PrepareElasticsearchDataArgs): CmsContentIndexEntry => {
    const { context, originalEntry, storageEntry, model } = args;
    const fieldToElasticsearchPlugins = context.plugins.byType<CmsModelFieldToElasticsearchPlugin>(
        "cms-model-field-to-elastic-search"
    );
    // we will use this plugin if no targeted plugin found
    const defaultIndexFieldPlugin = fieldToElasticsearchPlugins.find(
        plugin => plugin.fieldType === "*"
    );

    const modelFieldToGraphqlPlugins = context.plugins.byType<CmsModelFieldToGraphQLPlugin>(
        "cms-model-field-to-graphql"
    );
    const mappedPluginFieldTypes: Record<string, CmsModelFieldToGraphQLPlugin> = {};
    for (const plugin of modelFieldToGraphqlPlugins) {
        mappedPluginFieldTypes[plugin.fieldType] = plugin;
    }

    const fieldsAsObject: Record<string, CmsContentModelField> = {};
    for (const field of model.fields) {
        fieldsAsObject[field.fieldId] = field;
    }

    const mappedFieldToElasticsearchPlugins: Record<
        string,
        CmsModelFieldToElasticsearchPlugin
    > = {};
    for (const plugin of fieldToElasticsearchPlugins.reverse()) {
        if (mappedFieldToElasticsearchPlugins[plugin.fieldType]) {
            continue;
        }
        mappedFieldToElasticsearchPlugins[plugin.fieldType] = plugin;
    }

    let toIndexEntry: CmsContentIndexEntry = {
        ...lodashCloneDeep(storageEntry),
        rawValues: {}
    };
    for (const fieldId in storageEntry.values) {
        if (storageEntry.values.hasOwnProperty(fieldId) === false) {
            continue;
        }

        const field = fieldsAsObject[fieldId];
        if (!field) {
            throw new Error(`There is no field type with fieldId "${fieldId}".`);
        }
        const fieldTypePlugin = mappedPluginFieldTypes[field.type];
        if (!fieldTypePlugin) {
            throw new Error(`Missing field type plugin "${field.type}".`);
        }

        const targetFieldPlugin =
            mappedFieldToElasticsearchPlugins[field.type] || defaultIndexFieldPlugin;
        // we decided to take only last registered plugin for given field type
        if (targetFieldPlugin && targetFieldPlugin.toIndex) {
            const newEntryValues = targetFieldPlugin.toIndex({
                context,
                model,
                field,
                toIndexEntry,
                originalEntry,
                storageEntry,
                fieldTypePlugin
            });
            toIndexEntry = {
                ...toIndexEntry,
                ...newEntryValues
            };
        }
    }
    return toIndexEntry;
};

const setupEntriesIndexHelpers = ({ context, model }: SetupEntriesIndexHelpersArgs) => {
    const plugins = context.plugins.byType<CmsModelFieldToElasticsearchPlugin>(
        "cms-model-field-to-elastic-search"
    );
    const fieldsAsObject: Record<string, CmsContentModelField> = {};
    for (const field of model.fields) {
        fieldsAsObject[field.fieldId] = field;
    }

    const fieldIndexPlugins: Record<string, CmsModelFieldToElasticsearchPlugin> = {};
    for (const plugin of plugins.reverse()) {
        if (fieldIndexPlugins[plugin.fieldType]) {
            continue;
        }
        fieldIndexPlugins[plugin.fieldType] = plugin;
    }
    // we will use this plugin if no targeted plugin found
    const defaultIndexFieldPlugin = plugins.find(plugin => plugin.fieldType === "*");
    return {
        fieldsAsObject,
        fieldIndexPlugins,
        defaultIndexFieldPlugin
    };
};

export const extractEntriesFromIndex = ({
    context,
    entries,
    model
}: ExtractEntriesFromIndexArgs): CmsContentEntry[] => {
    const { fieldsAsObject, fieldIndexPlugins, defaultIndexFieldPlugin } = setupEntriesIndexHelpers(
        {
            context,
            model
        }
    );

    const mappedPluginFieldTypes: Record<
        string,
        CmsModelFieldToGraphQLPlugin
    > = context.plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce((plugins, plugin) => {
            plugins[plugin.fieldType] = plugin;
            return plugins;
        }, {});

    const list: CmsContentEntry[] = [];
    for (const entry of entries) {
        let fromIndexEntry: CmsContentIndexEntry = lodashCloneDeep(entry);
        for (const fieldId in fieldsAsObject) {
            if (fieldsAsObject.hasOwnProperty(fieldId) === false) {
                continue;
            }
            const field = fieldsAsObject[fieldId];
            const fieldTypePlugin = mappedPluginFieldTypes[field.type];
            if (!fieldTypePlugin) {
                throw new Error(`Missing field type plugin "${field.type}".`);
            }
            const targetFieldPlugin = fieldIndexPlugins[field.type] || defaultIndexFieldPlugin;
            if (targetFieldPlugin && targetFieldPlugin.fromIndex) {
                try {
                    const calculatedEntry = targetFieldPlugin.fromIndex({
                        context,
                        model,
                        field,
                        entry: fromIndexEntry,
                        fieldTypePlugin
                    });
                    fromIndexEntry = {
                        ...fromIndexEntry,
                        ...calculatedEntry
                    };
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not transform entry field from index.",
                        ex.code || "FIELD_FROM_INDEX_ERROR",
                        {
                            field,
                            entry: fromIndexEntry
                        }
                    );
                }
            }
        }
        list.push(fromIndexEntry);
    }

    return list;
};
