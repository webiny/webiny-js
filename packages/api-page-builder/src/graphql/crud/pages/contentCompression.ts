import { ContentCompressionPlugin, CompressedValue } from "~/plugins/ContentCompressionPlugin";
import WebinyError from "@webiny/error";
import { Page } from "~/types";

/**
 * Decompression works in a way that we cycle through the compression plugins and find the one which can decompress the data.
 * We get the reversed plugin array because we always compress with the last one so we try to decompress in that order.
 */
export const extractContent = async (
    plugins: ContentCompressionPlugin[],
    page: Page
): Promise<Record<string, any>> => {
    const value = page.content as CompressedValue;
    /**
     * Possibly no compression on the content so lets return what ever is inside the content.
     */
    if (!value || !value.compression) {
        return value;
    }
    const plugin = plugins.find(pl => pl.canDecompress(value));
    if (!plugin) {
        throw new WebinyError(
            "There is no compression plugin to decompress the page content.",
            "MISSING_COMPRESSION_PLUGIN",
            {
                compression: value.compression,
                id: page.id
            }
        );
    }

    try {
        return await plugin.decompress(value);
    } catch (ex) {
        console.log(`Error while decompressing page "${page.id}" content: ${ex.message}`);
        return null;
    }
};
/**
 * Compressions receives reversed plugins array because we always compress with last registered plugin.
 */
export const compressContent = async (
    plugins: ContentCompressionPlugin[],
    page: Page
): Promise<CompressedValue> => {
    const value = page.content as Record<string, any>;

    const [plugin] = plugins;

    if (value && value.compression) {
        return value as CompressedValue;
    }
    try {
        return await plugin.compress(value);
    } catch (ex) {
        console.log(`Error while compressing page "${page.id}" content: ${ex.message}`);
        return null;
    }
};
