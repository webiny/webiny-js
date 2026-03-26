import WebinyError from "@webiny/error";
import { CmsEntryElasticsearchQueryBuilderValueSearchPlugin } from "~/plugins/index.js";
import type { PluginsContainer } from "@webiny/plugins";
import type { OpenSearchQuerySearchValuePlugins } from "../types.js";

interface Params {
    plugins: PluginsContainer;
}
export const createSearchPluginList = ({ plugins }: Params): OpenSearchQuerySearchValuePlugins => {
    return plugins
        .byType<CmsEntryElasticsearchQueryBuilderValueSearchPlugin>(
            CmsEntryElasticsearchQueryBuilderValueSearchPlugin.type
        )
        .reduce<OpenSearchQuerySearchValuePlugins>((plugins, plugin) => {
            if (plugins[plugin.fieldType]) {
                throw new WebinyError(
                    "There is a ElasticsearchQueryBuilderValueSearchPlugin defined for the field type.",
                    "PLUGIN_ALREADY_EXISTS",
                    {
                        fieldType: plugin.fieldType,
                        name: plugin.name || "unknown"
                    }
                );
            }
            plugins[plugin.fieldType] = plugin;

            return plugins;
        }, {});
};
