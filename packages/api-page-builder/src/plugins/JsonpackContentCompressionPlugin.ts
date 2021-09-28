import jsonpack from "jsonpack";
import { ContentCompressionPlugin, CompressedValue } from "./ContentCompressionPlugin";

const JSONPACK_COMPRESSION = "jsonpack";

/**
 * The default compression plugin for the page content field.
 */
export class JsonpackContentCompressionPlugin extends ContentCompressionPlugin {
    public constructor() {
        super(JSONPACK_COMPRESSION);
    }

    public canDecompress(value: CompressedValue): boolean {
        return value.compression === JSONPACK_COMPRESSION;
    }

    public async compress(value: any): Promise<CompressedValue> {
        if (!value) {
            return {
                compression: JSONPACK_COMPRESSION,
                content: null
            };
        }
        let compressed = null;
        try {
            compressed = jsonpack.pack(value);
        } catch (ex) {
            console.log(`Error while compressing page content: ${ex.message}`);
        }

        return {
            compression: JSONPACK_COMPRESSION,
            content: compressed
        };
    }

    public async decompress(value: CompressedValue): Promise<any> {
        if (!value || !value.content) {
            return null;
        }
        try {
            return jsonpack.unpack(value.content);
        } catch (ex) {
            console.log(`Error while decompressing page content: ${ex.message}`);
            return null;
        }
    }
}
