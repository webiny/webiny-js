import { ElasticsearchIndexPlugin } from "~/plugins/definition/ElasticsearchIndexPlugin";
import { PluginsContainer } from "@webiny/plugins";
import WebinyError from "@webiny/error";

interface IndicesPluginsParams {
    container: PluginsContainer;
    type: string;
    locale: string;
}
const listIndicesPlugins = <T extends ElasticsearchIndexPlugin>({
    container,
    type,
    locale
}: IndicesPluginsParams): T[] => {
    return container.byType<T>(type).filter(plugin => {
        return plugin.canUse(locale);
    });
};

export const getLastAddedIndexPlugin = <T extends ElasticsearchIndexPlugin>(
    params: IndicesPluginsParams
): T => {
    const plugins = listIndicesPlugins<T>(params);
    if (plugins.length === 0) {
        throw new WebinyError(
            `Could not find a single ElasticsearchIndexPlugin of type "${params.type}".`,
            "ELASTICSEARCH_INDEX_TEMPLATE_ERROR",
            {
                type: params.type,
                locale: params.locale
            }
        );
    }

    return plugins.pop() as T;
};
