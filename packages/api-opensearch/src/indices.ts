import type { OpenSearchIndexPlugin } from "~/plugins/definition/OpenSearchIndexPlugin.js";
import type { PluginsContainer } from "@webiny/plugins";
import WebinyError from "@webiny/error";

interface IndicesPluginsParams {
    container: PluginsContainer;
    type: string;
}
const listIndicesPlugins = <T extends OpenSearchIndexPlugin>({
    container,
    type
}: IndicesPluginsParams): T[] => {
    return container.byType<T>(type).filter(plugin => {
        return plugin.canUse();
    });
};

export const getLastAddedIndexPlugin = <T extends OpenSearchIndexPlugin>(
    params: IndicesPluginsParams
): T => {
    const plugins = listIndicesPlugins<T>(params);
    if (plugins.length === 0) {
        throw new WebinyError(
            `Could not find a single OpenSearchIndexPlugin of type "${params.type}".`,
            "OPENSEARCH_INDEX_TEMPLATE_ERROR",
            {
                type: params.type
            }
        );
    }

    return plugins.pop() as T;
};
