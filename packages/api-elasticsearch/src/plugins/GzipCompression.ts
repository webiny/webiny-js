import { CompressionPlugin } from "~/plugins/definition/CompressionPlugin";
import { compress as gzip, decompress as ungzip } from "@webiny/utils/compression/gzip";

const GZIP = "gzip";
const TO_STORAGE_ENCODING = "base64";
const FROM_STORAGE_ENCODING = "utf8";

const convertToBuffer = (value: string | Buffer) => {
    if (typeof value === "string") {
        return Buffer.from(value, TO_STORAGE_ENCODING);
    }
    return value;
};

export interface CompressedData {
    compression: string;
    value: string;
}

export interface OriginalData {
    [key: string]: any;
}

class GzipCompression extends CompressionPlugin {
    public canCompress(data: any): boolean {
        /**
         * If already compressed, skip this.
         */
        if (data.compression) {
            if (data.compression !== "GZIP") {
                console.log(`Data is already compressed with "${data.compression}".`);
            }
            return false;
        }
        return true;
    }
    public async compress(data: any) {
        const value = await gzip(JSON.stringify(data));

        return {
            compression: GZIP,
            value: value.toString(TO_STORAGE_ENCODING)
        };
    }

    public canDecompress(data: CompressedData | Record<string, any>): boolean {
        if (!data || !data.compression) {
            return false;
        } else if (data.compression !== GZIP) {
            console.log(
                `Could not decompress given data since its compression is not "${GZIP}". It is "${data.compression}".`
            );
            return false;
        }
        return true;
    }

    public async decompress(data: CompressedData): Promise<OriginalData | null> {
        try {
            const buf = await ungzip(convertToBuffer(data.value));
            const value = buf.toString(FROM_STORAGE_ENCODING);
            return JSON.parse(value);
        } catch {
            return null;
        }
    }
}

export const createGzipCompression = () => {
    return new GzipCompression();
};
/**
 * Left due to backward compatibility with older systems.
 * Remove when upgraded the system to run from @webiny/api-serverless-cms-aws
 */
export default () => {
    return createGzipCompression();
};
