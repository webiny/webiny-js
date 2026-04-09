import type { PluginsContainer } from "@webiny/plugins";
import { CompressionPlugin, type ICompressedValue } from "./CompressionPlugin.js";
import { createGzipCompression } from "./plugins/GzipCompression.js";
import { createJsonpackCompression } from "./plugins/JsonpackCompression.js";

export interface ICompressorParams {
    plugins: PluginsContainer;
}

export interface ICompressor {
    disable(name: string): void;
    enable(name: string): void;
    /**
     * Compresses the given data using the first plugin that can compress it.
     */
    compress<T = unknown>(data: T): Promise<T | ICompressedValue>;
    /**
     * Decompresses the given data using the first plugin that can decompress it.
     */
    decompress<T = unknown>(data: ICompressedValue | unknown): Promise<T>;
}

class Compressor implements ICompressor {
    private readonly _plugins: PluginsContainer;

    private readonly disabled: Set<string> = new Set();

    private get plugins(): CompressionPlugin[] {
        return this._plugins.byType<CompressionPlugin>(CompressionPlugin.type).reverse();
    }

    public constructor(params: ICompressorParams) {
        this._plugins = params.plugins;
    }

    public disable(name: string): void {
        this.disabled.add(name);
    }

    public enable(name: string): void {
        this.disabled.delete(name);
    }

    public async compress<T = unknown>(data: T): Promise<T | ICompressedValue> {
        for (const plugin of this.plugins) {
            /**
             * We skip disabled plugins.
             */
            if (plugin.name && this.disabled.has(plugin.name)) {
                continue;
            }
            if (plugin.canCompress(data) === false) {
                continue;
            }
            try {
                return await plugin.compress(data);
            } catch (ex) {
                console.error(
                    `Could not compress given data. More info in next line. Trying next plugin.`
                );
                console.log(ex);
            }
        }
        return data;
    }

    public async decompress<T = unknown>(data: ICompressedValue | unknown): Promise<T> {
        for (const plugin of this.plugins) {
            if (plugin.canDecompress(data) === false) {
                continue;
            }
            try {
                return await plugin.decompress(data);
            } catch (ex) {
                console.error(
                    `Could not decompress given data. More info in next line. Trying next plugin.`
                );
                console.log(ex);
            }
        }
        return data as T;
    }
}

export const createDefaultCompressor = (params: ICompressorParams) => {
    const { plugins } = params;
    plugins.register([createJsonpackCompression(), createGzipCompression()]);
    return new Compressor({
        plugins
    });
};
