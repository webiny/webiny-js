import { CompressionHandler as CompressionHandlerAbstraction } from "./abstractions/CompressionHandler.js";
import { Compression } from "./abstractions/Compression.js";

class CompressionHandlerImpl implements CompressionHandlerAbstraction.Interface {
    public constructor(private readonly compressions: Compression.Interface[]) {}

    public async compress<T = unknown>(
        data: CompressionHandlerAbstraction.CompressParams<T>
    ): CompressionHandlerAbstraction.CompressResponse {
        for (const compression of this.compressions) {
            if (compression.canCompress(data)) {
                return compression.compress<T>(data);
            }
        }
        /**
         * Just return what was received as no compressor can handle that type of data.
         */
        // @ts-expect-error
        return data;
    }

    public async decompress<T = unknown>(
        data: CompressionHandlerAbstraction.DecompressParams | unknown
    ): CompressionHandlerAbstraction.DecompressResponse<T> {
        for (const compression of this.compressions) {
            if (compression.canDecompress(data)) {
                return compression.decompress<T>(data);
            }
        }
        return data as T;
    }
}

export const CompressionHandler = CompressionHandlerAbstraction.createImplementation({
    implementation: CompressionHandlerImpl,
    dependencies: [[Compression, { multiple: true }]]
});
