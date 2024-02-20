import { CompressedValue, ContentCompressionPlugin } from "./ContentCompressionPlugin";
import { compress as gzip, decompress as ungzip } from "@webiny/utils/compression/gzip";

const GZIP_COMPRESSION = "gzip";
const TO_STORAGE_ENCODING = "base64";
const FROM_STORAGE_ENCODING = "utf8";

const convertToBuffer = (value: string | Buffer): Buffer => {
    if (typeof value === "string") {
        return Buffer.from(value, TO_STORAGE_ENCODING);
    }
    return value;
};

/**
 * The GZIP compression for content field.
 */
export class GzipContentCompressionPlugin extends ContentCompressionPlugin {
    public constructor() {
        super(GZIP_COMPRESSION);
    }

    public canCompress(): boolean {
        return true;
    }

    public canDecompress(value: CompressedValue): boolean {
        if (!value || !value.compression) {
            return false;
        }
        return value.compression === GZIP_COMPRESSION;
    }

    public async compress(initialValue: any): Promise<CompressedValue> {
        if (!initialValue) {
            return {
                compression: GZIP_COMPRESSION,
                content: null
            };
        }
        try {
            const value = JSON.stringify(initialValue);
            const compressed = await gzip(value);

            const content = compressed.toString(TO_STORAGE_ENCODING);

            return {
                compression: GZIP_COMPRESSION,
                content
            };
        } catch (ex) {
            console.log(`Error while compressing page content: ${ex.message}`);
        }

        return {
            compression: GZIP_COMPRESSION,
            content: null
        };
    }

    public async decompress(value: CompressedValue): Promise<any> {
        if (!value?.content) {
            return null;
        }

        try {
            const buf = await ungzip(convertToBuffer(value.content));
            const result = buf.toString(FROM_STORAGE_ENCODING);
            return JSON.parse(result);
        } catch (ex) {
            console.log("Error while transforming long-text.");
            console.log(ex.message);
            return "";
        }
    }
}
