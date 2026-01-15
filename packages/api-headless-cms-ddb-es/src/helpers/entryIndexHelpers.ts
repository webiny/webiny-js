import WebinyError from "@webiny/error";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsModelFieldToGraphQLPlugin
} from "@webiny/api-headless-cms/types/index.js";
import type { CmsIndexEntry, CmsModelFieldToElasticsearchPlugin } from "~/types.js";
import type { PluginsContainer } from "@webiny/plugins";
import { getFieldIdentifier, getFieldIdentifiers } from "~/helpers/fieldIdentifier.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

interface SetupEntriesIndexHelpersParams {
    plugins: PluginsContainer;
}

interface ExtractEntriesFromIndexParams<T extends CmsEntryValues = CmsEntryValues>
    extends SetupEntriesIndexHelpersParams {
    model: CmsModel;
    entries: CmsIndexEntry<T>[];
}

interface PrepareElasticsearchDataParams<T extends CmsEntryValues = CmsEntryValues>
    extends SetupEntriesIndexHelpersParams {
    model: CmsModel;
    entry: CmsEntry<T>;
    storageEntry: CmsEntry<T>;
}

export const prepareEntryToIndex = <T extends CmsEntryValues = CmsEntryValues>(
    params: PrepareElasticsearchDataParams<T>
): CmsIndexEntry<T> => {
    const { plugins, storageEntry, entry, model } = params;
    const { fieldIndexPlugins, defaultIndexFieldPlugin, fieldTypePlugins } =
        setupEntriesIndexHelpers({ plugins });

    function getFieldIndexPlugin(type: string) {
        const fieldType = getBaseFieldType({
            type
        });
        return fieldIndexPlugins[fieldType] || defaultIndexFieldPlugin;
    }

    function getFieldTypePlugin(type: string) {
        const fieldType = getBaseFieldType({
            type
        });
        const pl = fieldTypePlugins[fieldType];
        if (pl) {
            return pl;
        }
        throw new WebinyError(`Missing field type plugin "${fieldType}". Prepare entry for index.`);
    }

    // These objects will contain values processed by field index plugins
    const values: T = {} as T;
    const rawValues: T = {} as T;

    // We're only interested in current model fields.
    for (const field of model.fields) {
        const identifier = getFieldIdentifier(storageEntry.values, field) as keyof T;
        if (!identifier) {
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
            rawValue: entry.values[identifier],
            value: storageEntry.values[identifier],
            getFieldIndexPlugin,
            getFieldTypePlugin
        });

        if (typeof value !== "undefined") {
            values[identifier] = value;
        }

        if (typeof rawValue !== "undefined") {
            rawValues[identifier] = rawValue;
        }
    }
    return {
        ...storageEntry,
        values,
        rawValues
    };
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

export const extractEntriesFromIndex = <T extends CmsEntryValues = CmsEntryValues>({
    plugins,
    entries,
    model
}: ExtractEntriesFromIndexParams<T>): CmsEntry<T>[] => {
    const { fieldIndexPlugins, defaultIndexFieldPlugin, fieldTypePlugins } =
        setupEntriesIndexHelpers({ plugins });

    function getFieldIndexPlugin(type: string) {
        const fieldType = getBaseFieldType({
            type
        });
        return fieldIndexPlugins[fieldType] || defaultIndexFieldPlugin;
    }

    function getFieldTypePlugin(type: string) {
        const fieldType = getBaseFieldType({
            type
        });
        return fieldTypePlugins[fieldType];
    }

    const list: CmsEntry<T>[] = [];

    for (const entry of entries) {
        // This object will contain values processed by field index plugins
        const indexValues: T = {} as T;

        // We only consider fields that are present in the model
        for (const field of model.fields) {
            const fieldTypePlugin = getFieldTypePlugin(field.type);
            if (!fieldTypePlugin) {
                throw new WebinyError(
                    `Missing field type plugin "${field.type}". Extract entries from index.`
                );
            }

            const targetFieldPlugin = getFieldIndexPlugin(field.type);
            if (!targetFieldPlugin || !targetFieldPlugin.fromIndex) {
                continue;
            }
            /**
             * We can safely cast as the code will not continue in case of no identifiers.
             */
            const identifiers = getFieldIdentifiers(entry.values, entry.rawValues, field);
            if (!identifiers) {
                continue;
            }

            try {
                const key = identifiers.valueIdentifier as keyof T;
                const rawKey = identifiers.rawValueIdentifier as keyof T;
                indexValues[key] = targetFieldPlugin.fromIndex({
                    plugins,
                    model,
                    field,
                    getFieldIndexPlugin,
                    getFieldTypePlugin,
                    value: entry.values[key || rawKey],
                    /**
                     * Possibly no rawValues so we must check for the existence of the field.
                     */
                    rawValue: entry.rawValues ? entry.rawValues[rawKey || key] : null
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not transform entry field from index.",
                    ex.code || "FIELD_FROM_INDEX_ERROR",
                    {
                        field,
                        entry
                    }
                );
            }
        }
        /**
         * Let's have a new entry so we do not modify the original one.
         */
        const newEntry: CmsEntry<T> = {
            ...entry,
            values: indexValues
        };
        /**
         * If we want to remove the rawValues, TYPE, latest, published and __type, we must make them optional or ignore them.
         */
        // @ts-expect-error
        delete newEntry["rawValues"];
        // @ts-expect-error
        delete newEntry["TYPE"];
        // @ts-expect-error
        delete newEntry["__type"];
        // @ts-expect-error
        delete newEntry["latest"];
        // @ts-expect-error
        delete newEntry["published"];
        list.push({
            ...newEntry
        });
    }

    return list;
};
