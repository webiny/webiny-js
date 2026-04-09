import {
    Compression as CompressionAbstraction,
    ICompressedValue
} from "./abstractions/Compression.js";
import { createGzipCompression } from "./legacy/index.js";

const plugin = createGzipCompression();

class GzipCompressionImpl implements CompressionAbstraction.Interface {
    public readonly name = "gzip";

    public canCompress(data: any): boolean {
        return plugin.canCompress(data);
    }

    public async compress<T>(data: T): Promise<ICompressedValue> {
        return plugin.compress(data);
    }

    public canDecompress(data: ICompressedValue | unknown): boolean {
        // @ts-expect-error
        return plugin.canDecompress(data);
    }

    public async decompress<T>(data: ICompressedValue | unknown): Promise<T> {
        // @ts-expect-error
        return plugin.decompress(data);
    }
}

export const GzipCompression = CompressionAbstraction.createImplementation({
    implementation: GzipCompressionImpl,
    dependencies: []
});
