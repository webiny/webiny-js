import { PluginsContainer } from "@webiny/plugins";
import { CompressedValue, ContentCompressionPlugin } from "~/plugins/ContentCompressionPlugin";
import WebinyError from "@webiny/error";
import { Page } from "~/types";

export interface CreateCompressionParams {
    plugins: PluginsContainer;
}

export interface CompressContentCallable {
    (page: Page): Promise<CompressedValue | null>;
}

export interface DecompressContentCallable {
    (page: Page): Promise<Record<string, any> | null>;
}

export interface CreateCompressionResult {
    compressContent: CompressContentCallable;
    decompressContent: DecompressContentCallable;
}

const createCompressContent = (plugins: ContentCompressionPlugin[]): CompressContentCallable => {
    return async (page: Page) => {
        const value = page.content;

        if (value?.compression) {
            return value as CompressedValue;
        }

        const plugin = plugins.find(pl => pl.canCompress(value));
        if (!plugin) {
            throw new WebinyError(
                "There is no compression plugin to compress the page content.",
                "MISSING_COMPRESSION_PLUGIN",
                {
                    id: page.id
                }
            );
        }

        try {
            return await plugin.compress(value);
        } catch (ex) {
            console.log(`Error while compressing page "${page.id}" content: ${ex.message}`);
            return null;
        }
    };
};

const createDecompressContent = (
    plugins: ContentCompressionPlugin[]
): DecompressContentCallable => {
    return async (page: Page) => {
        const value = page.content as CompressedValue;
        /**
         * Possibly no compression on the content so lets return what ever is inside the content.
         */
        if (!value?.compression) {
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
};

export const createCompression = (params: CreateCompressionParams): CreateCompressionResult => {
    const plugins = params.plugins
        .byType<ContentCompressionPlugin>(ContentCompressionPlugin.type)
        .reverse();
    if (plugins.length === 0) {
        throw new WebinyError(
            "Missing content compression plugins. Must have at least one registered.",
            "MISSING_COMPRESSION_PLUGINS"
        );
    }

    return {
        compressContent: createCompressContent(plugins),
        decompressContent: createDecompressContent(plugins)
    };
};
