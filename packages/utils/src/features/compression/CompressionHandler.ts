import { CompressionHandler as CompressionHandlerAbstraction } from "./abstractions/CompressionHandler.js";

class CompressionHandlerImpl implements CompressionHandlerAbstraction.Interface {
    public async compress<T = unknown>(
        data: CompressionHandlerAbstraction.CompressParams<T>
    ): CompressionHandlerAbstraction.CompressResponse<T> {
        return data;
    }

    public async decompress<T = unknown>(
        data: CompressionHandlerAbstraction.DecompressParams | unknown
    ): CompressionHandlerAbstraction.DecompressResponse<T> {
        return data as T;
    }
}

export const CompressionHandler = CompressionHandlerAbstraction.createImplementation({
    implementation: CompressionHandlerImpl,
    dependencies: []
});
