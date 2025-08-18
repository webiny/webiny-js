import type { PluginsContainer } from "@webiny/plugins";
import { CompressorPlugin } from "@webiny/api";

/**
 * Method to compress the elasticsearch data that is going to be stored into the DynamoDB table that is meant for elasticsearch.
 */
export const compress = async (
    pluginsContainer: PluginsContainer,
    data: Record<string, any>
): Promise<Record<string, any>> => {
    let plugin: CompressorPlugin;
    try {
        plugin = pluginsContainer.oneByType<CompressorPlugin>(CompressorPlugin.type);
    } catch {
        return data;
    }
    return plugin.getCompressor().compress(data);
};

export const decompress = async (
    pluginsContainer: PluginsContainer,
    data: Record<string, any>
): Promise<Record<string, any>> => {
    let plugin: CompressorPlugin;
    try {
        plugin = pluginsContainer.oneByType<CompressorPlugin>(CompressorPlugin.type);
    } catch {
        return data;
    }
    return plugin.getCompressor().decompress(data);
};
