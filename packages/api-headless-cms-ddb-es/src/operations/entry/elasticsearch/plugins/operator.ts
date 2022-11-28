import { PluginsContainer } from "@webiny/plugins";
import { ElasticsearchQueryBuilderOperatorPlugin } from "@webiny/api-elasticsearch";
import { ElasticsearchQueryBuilderOperatorPlugins } from "../types";

interface Params {
    plugins: PluginsContainer;
    locale: string;
}
export const createOperatorPluginList = (
    params: Params
): ElasticsearchQueryBuilderOperatorPlugins => {
    const { plugins, locale } = params;
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
             * We only allow the plugins which can pass the locale test.
             * The default plugins always return true.
             */
            if (plugin.isLocaleSupported(locale) === false) {
                return acc;
            }
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
