import { CompressionPlugin } from "~/plugins/definition/CompressionPlugin";
import { PluginsContainer } from "@webiny/plugins";

/**
 * Get the compression plugins, in reverse order, because we want to use the last one added - first.
 */
const getCompressionPlugins = (plugins: PluginsContainer): CompressionPlugin[] => {
    return plugins.byType<CompressionPlugin>(CompressionPlugin.type).reverse();
};
/**
 * Method to compress the elasticsearch data that is going to be stored into the DynamoDB table that is meant for elasticsearch.
 */
export const compress = async (
    pluginsContainer: PluginsContainer,
    data: Record<string, any>
): Promise<Record<string, any>> => {
    const plugins = getCompressionPlugins(pluginsContainer);
    if (plugins.length === 0) {
        return data;
    }
    for (const plugin of plugins) {
        if (plugin.canCompress(data) === false) {
            continue;
        }
        return await plugin.compress(data);
    }
    /**
     * Possibly no plugins that can compress, just return the data.
     */
    return data;
};

export const decompress = async (
    pluginsContainer: PluginsContainer,
    data: Record<string, any>
): Promise<Record<string, any>> => {
    const plugins = getCompressionPlugins(pluginsContainer);
    if (plugins.length === 0) {
        return data;
    }
    for (const plugin of plugins) {
        if (plugin.canDecompress(data) === false) {
            continue;
        }
        return await plugin.decompress(data);
    }
    /**
     * Possibly no plugins that can decompress, just return the data.
     */
    return data;
};
