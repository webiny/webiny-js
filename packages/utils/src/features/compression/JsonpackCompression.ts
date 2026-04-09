import { Compression as CompressionAbstraction } from "./abstractions/Compression.js";
import { createJsonpackCompression } from "./legacy/index.js";

const plugin = createJsonpackCompression();

class JsonpackCompressionImpl implements CompressionAbstraction.Interface {
    public readonly name = "jsonpack";
    /**
     * We do not want to use jsonpack for compression anymore, but we want to keep the plugin around for decompression of old data.
     */
    public canCompress(): boolean {
        return false;
    }

    public async compress(
        data: CompressionAbstraction.CompressParams
    ): CompressionAbstraction.CompressResponse {
        return plugin.compress(data);
    }

    public canDecompress(data: CompressionAbstraction.DecompressParams): boolean {
        // @ts-expect-error
        return plugin.canDecompress(data);
    }

    public async decompress<T>(
        data: CompressionAbstraction.DecompressParams
    ): CompressionAbstraction.DecompressResponse<T> {
        // @ts-expect-error
        return plugin.decompress(data);
    }
}

export const JsonpackCompression = CompressionAbstraction.createImplementation({
    implementation: JsonpackCompressionImpl,
    dependencies: []
});
