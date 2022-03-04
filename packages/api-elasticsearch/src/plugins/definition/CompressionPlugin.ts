import { Plugin } from "@webiny/plugins";

export abstract class CompressionPlugin extends Plugin {
    public static override readonly type: string = "elasticsearch.compression";
    /**
     * Check if data can be compressed.
     */
    public abstract canCompress(data: any): boolean;
    /**
     * Pass the data to get the compressed one back.
     */
    public abstract compress(data: any): Promise<any>;
    /**
     * Check if data can be decompressed.
     */
    public abstract canDecompress(data: any): boolean;
    /**
     * Passed the compressed data to get the original data back.
     */
    public abstract decompress(data: any): Promise<any>;
}
