import { createAbstraction } from "@webiny/feature/api";

export interface ICompressedValue {
    compression: string;
    value: string;
}

export interface ICompressionHandler {
    /**
     * Compresses the given data using the first plugin that can compress it.
     */
    compress<T = unknown>(data: T): Promise<T | ICompressedValue>;
    /**
     * Decompresses the given data using the first plugin that can decompress it.
     */
    decompress<T = unknown>(data: ICompressedValue | unknown): Promise<T>;
}

export const CompressionHandler = createAbstraction<ICompressionHandler>("Api/Compression/Handler");

export namespace CompressionHandler {
    export type Interface = ICompressionHandler;
    export type CompressParams<T = unknown> = T;
    export type CompressResponse<T = unknown> = Promise<T | ICompressedValue>;
    export type DecompressParams = ICompressedValue | unknown;
    export type DecompressResponse<T = unknown> = Promise<T>;
}
