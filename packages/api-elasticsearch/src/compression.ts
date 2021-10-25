import { ContextInterface } from "@webiny/handler/types";
import { CompressionPlugin } from "~/plugins/definition/CompressionPlugin";

/**
 * Get the compression plugins, in reverse order, because we want to use the last one added - first.
 */
const getCompressionPlugins = (context: ContextInterface): CompressionPlugin[] => {
    return context.plugins.byType<CompressionPlugin>(CompressionPlugin.type).reverse();
};
/**
 * Method to compress the elasticsearch data that is going to be stored into the DynamoDB table that is meant for elasticsearch.
 */
export const compress = async (
    context: ContextInterface,
    data: Record<string, any>
): Promise<Record<string, any>> => {
    const plugins = getCompressionPlugins(context);
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
    context: ContextInterface,
    data: Record<string, any>
): Promise<Record<string, any>> => {
    const plugins = getCompressionPlugins(context);
    if (plugins.length === 0) {
        console.log("No decompression plugins.");
        return data;
    }
    for (const plugin of plugins) {
        if (plugin.canDecompress(data) === false) {
            continue;
        }
        console.log(`Decompressing with "${plugin.getName()}".`);
        return await plugin.decompress(data);
    }
    /**
     * Possibly no plugins that can decompress, just return the data.
     */
    return data;
};
