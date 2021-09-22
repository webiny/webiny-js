import { Plugin } from "@webiny/plugins";
import WebinyError from "@webiny/error";

export interface CompressedValue {
    compression: string;
    content: string;
}

export abstract class ContentCompressionPlugin extends Plugin {
    public static readonly type: string = "pageBuilder.page.content.compression";

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

    public abstract canDecompress(value: CompressedValue): boolean;

    public abstract compress(value: any): Promise<CompressedValue>;

    public abstract decompress(value: CompressedValue): Promise<any>;
}
