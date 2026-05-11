import { CompressionPlugin, type ICompressedValue } from "../CompressionPlugin.js";
import { compress as gzip, decompress as ungzip } from "../gzip.js";

const GZIP = "gzip";
const TO_STORAGE_ENCODING = "base64";
const FROM_STORAGE_ENCODING = "utf8";

export const convertToBuffer = (value: string | Buffer) => {
    if (typeof value === "string") {
        return Buffer.from(value, TO_STORAGE_ENCODING);
    }
    return value;
};

export class GzipCompression extends CompressionPlugin {
    public override name = "utils.compression.gzip";

    public override canCompress(data: any): boolean {
        if (!!data?.compression) {
            return false;
        }
        return true;
    }

    public override async compress(data: any): Promise<ICompressedValue> {
        if (data === null || data === undefined) {
            return data;
        }
        // This stringifies both regular strings and JSON objects.
        const value = await gzip(JSON.stringify(data));

        return {
            compression: GZIP,
            value: value.toString(TO_STORAGE_ENCODING)
        };
    }

    public override canDecompress(data: Partial<ICompressedValue>): boolean {
        if (!data?.compression) {
            return false;
        }

        const compression = data.compression as string;

        return compression.toLowerCase() === GZIP;
    }

    public override async decompress(data: ICompressedValue): Promise<any> {
        if (!data) {
            return data;
        } else if (!data.value) {
            return null;
        }
        /**
         * First we need to convert the value to a buffer, if it fails, then we know the data is corrupted and we should return null.
         */
        let buf: Buffer;
        try {
            buf = convertToBuffer(data.value);
        } catch (ex) {
            console.log(`Could not convert given data to buffer.`, ex.message);
            console.log({
                data
            });
            return null;
        }
        /**
         * First let's attempt to ungzip the value, if it fails, then we know the data is corrupted and we should return null.
         * If it succeeds, then we can attempt to parse the value as JSON, but if that fails, we can just return the string value.
         */
        let value: string;
        try {
            const decompressed = await ungzip(buf);
            value = decompressed.toString(FROM_STORAGE_ENCODING);
        } catch (ex) {
            console.log(`Could not decompress given data.`, ex.message);
            console.log({
                data
            });
            return null;
        }
        /**
         * Legacy systems may have stored regular strings without stringify, so we should attempt to parse the value, but if it fails, just return the string.
         */
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }
}

export const createGzipCompression = () => {
    return new GzipCompression();
};
