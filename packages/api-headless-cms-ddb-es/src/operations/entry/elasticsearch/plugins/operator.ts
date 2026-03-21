import type { PluginsContainer } from "@webiny/plugins";
import { OpenSearchQueryBuilderOperatorPlugin as ElasticsearchQueryBuilderOperatorPlugin } from "@webiny/api-opensearch";
import type { ElasticsearchQueryBuilderOperatorPlugins } from "../types.js";

interface Params {
    plugins: PluginsContainer;
}
export const createOperatorPluginList = (
    params: Params
): ElasticsearchQueryBuilderOperatorPlugins => {
    const { plugins } = params;
    /**
     * We always set the last one operator plugin added.
     * This way user can override the plugins.
     */
    return plugins
        .byType<ElasticsearchQueryBuilderOperatorPlugin>(
            ElasticsearchQueryBuilderOperatorPlugin.type
        )
        .reduce<ElasticsearchQueryBuilderOperatorPlugins>((acc, plugin) => {
            const operator = plugin.getOperator();
            /**
             * We also only allow the override of the plugins if the new plugin is NOT a default one.
             * If a user sets the plugin name ending with .default, we cannot do anything about it.
             */
            if (!!acc[operator] && (plugin.name || "").match(/\.default$/)) {
                return acc;
            }
            acc[operator] = plugin;
            return acc;
        }, {});
};
