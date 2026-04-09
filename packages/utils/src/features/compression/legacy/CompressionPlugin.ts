import { Plugin } from "@webiny/plugins";

export interface ICompressedValue {
    compression: string;
    value: string;
}

export abstract class CompressionPlugin extends Plugin {
    public static override type: string = "utils.compression";
    public abstract canCompress(data: any): boolean;
    public abstract compress(data: any): Promise<ICompressedValue>;
    public abstract canDecompress(data: ICompressedValue | unknown): boolean;
    public abstract decompress(data: ICompressedValue | unknown): Promise<any>;
}
