import WebinyError from "@webiny/error";
import { CmsEntryElasticsearchQueryBuilderValueSearchPlugin } from "~/plugins";
import { PluginsContainer } from "@webiny/plugins";
import { ElasticsearchQuerySearchValuePlugins } from "../types";

interface Params {
    plugins: PluginsContainer;
}
export const createSearchPluginList = ({
    plugins
}: Params): ElasticsearchQuerySearchValuePlugins => {
    return plugins
        .byType<CmsEntryElasticsearchQueryBuilderValueSearchPlugin>(
            CmsEntryElasticsearchQueryBuilderValueSearchPlugin.type
        )
        .reduce<ElasticsearchQuerySearchValuePlugins>((plugins, plugin) => {
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
