import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { normalizeValue } from "@webiny/api-elasticsearch";
import { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";
import { PluginsContainer } from "@webiny/plugins";
import {
    CmsEntryElasticsearchFullTextSearchPlugin,
    createCmsEntryElasticsearchFullTextSearchPlugin
} from "~/plugins";

const defaultPlugin = createCmsEntryElasticsearchFullTextSearchPlugin({
    apply: params => {
        const { query, term, fields, createFieldPath } = params;

        query.must.push({
            query_string: {
                allow_leading_wildcard: true,
                fields: fields.map(createFieldPath),
                query: normalizeValue(term),
                default_operator: "and"
            }
        });
    }
});
defaultPlugin.name = "headless-cms.elasticsearch.entry.fullTextSearch.default";

interface GetPluginParams {
    container: PluginsContainer;
    model: CmsModel;
}
const getPlugin = (params: GetPluginParams): CmsEntryElasticsearchFullTextSearchPlugin => {
    const { container, model } = params;
    const plugins = container
        .byType<CmsEntryElasticsearchFullTextSearchPlugin>(
            CmsEntryElasticsearchFullTextSearchPlugin.type
        )
        .reverse();
    /**
     * We need to find the most specific plugin for the given model.
     * Also, we need to use the first possible plugin if the specific one is not found.
     */
    let plugin: CmsEntryElasticsearchFullTextSearchPlugin | null = null;
    for (const pl of plugins) {
        if (pl.models.includes(model.modelId)) {
            return pl;
        } else if (!plugin) {
            plugin = pl;
        }
    }

    return plugin || defaultPlugin;
};

interface Params {
    plugins: PluginsContainer;
    model: CmsModel;
    query: ElasticsearchBoolQueryConfig;
    term?: string;
    fields: CmsModelField[];
}
export const applyFullTextSearch = (params: Params): void => {
    const { plugins, query, term, fields, model } = params;
    if (!term || term.length === 0 || fields.length === 0) {
        return;
    }

    const plugin = getPlugin({
        container: plugins,
        model
    });

    plugin.apply({
        model,
        createFieldPath: field => `values.${field.storageId}`,
        fields,
        query,
        term
    });
};
