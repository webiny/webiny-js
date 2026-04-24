import { createAbstraction } from "@webiny/feature/api";

export interface ICompressedValue {
    compression: string;
    value: string;
}

export interface ICompression {
    readonly name: string;
    canCompress(data: any): boolean;
    compress<T>(data: T): Promise<ICompressedValue>;
    canDecompress(data: ICompressedValue | unknown): boolean;
    decompress<T>(data: ICompressedValue | unknown): Promise<T>;
}

export const Compression = createAbstraction<ICompression>("Api/Compression/Type");

export namespace Compression {
    export type Interface = ICompression;
    export type CompressParams<T = unknown> = T;
    export type CompressResponse = Promise<ICompressedValue>;
    export type DecompressParams = ICompressedValue | unknown;
    export type DecompressResponse<T = unknown> = Promise<T>;
}
