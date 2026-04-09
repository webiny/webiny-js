import { createAbstraction } from "@webiny/feature/api";

export interface ICompressedValue {
    compression: string;
    value: string;
}

export interface ICompressionHandler {
    /**
     * Compresses the given data using the first plugin that can compress it.
     */
    compress<T = unknown>(data: T): Promise<ICompressedValue>;
    /**
     * Decompresses the given data using the first plugin that can decompress it.
     */
    decompress<T = unknown>(data: ICompressedValue | unknown): Promise<T>;
}

export const CompressionHandler = createAbstraction<ICompressionHandler>("Api/Compression/Handler");

export namespace CompressionHandler {
    export type Interface = ICompressionHandler;
    export type CompressParams<T = unknown> = T;
    export type CompressResponse = Promise<ICompressedValue>;
    export type DecompressParams = ICompressedValue | unknown;
    export type DecompressResponse<T = unknown> = Promise<T>;
}
