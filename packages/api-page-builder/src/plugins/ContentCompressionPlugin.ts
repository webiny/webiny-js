import { Plugin } from "@webiny/plugins";
import WebinyError from "@webiny/error";

export interface CompressedValue {
    compression: string;
    content: string | null;
}

/**
 * Functions that are using compress and decompress methods have try/catch around them.
 * canDecompress only expects boolean, no try/catch around it.
 */
export abstract class ContentCompressionPlugin extends Plugin {
    public static override readonly type: string = "pageBuilder.page.content.compression";

    public readonly identifier: string;

    protected constructor(identifier: string) {
        super();
        if (!identifier || identifier.length < 3) {
            throw new WebinyError(
                "Must initialize compression plugin with identifier that has at least three letter identifier.",
                "MALFORMED_COMPRESSION_PLUGIN_INIT",
                {
                    identifier
                }
            );
        }
        this.identifier = identifier;
    }
    /**
     * Must return true if it is possible to compress the content with given implementation.
     */
    public abstract canCompress(value: any): boolean;
    /**
     * Must return if it is possible to decompress the content with given implementation.
     * This step makes sure no invalid data is passed into decompress method.
     */
    public abstract canDecompress(value: CompressedValue): boolean;
    /**
     * Compress the content and return the CompressedValue object.
     * @throws
     */
    public abstract compress(value: any): Promise<CompressedValue>;
    /**
     * Decompress the content if possible. No need to check if given compressed value can be decompressed with given implementation.
     * It is done in the canDecompress step.
     * @throws
     */
    public abstract decompress(value: CompressedValue): Promise<any>;
}
