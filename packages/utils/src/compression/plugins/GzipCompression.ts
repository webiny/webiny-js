import { CompressionPlugin, type ICompressedValue } from "../CompressionPlugin";
import { compress as gzip, decompress as ungzip } from "~/compression/gzip";

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
        try {
            const buf = await ungzip(convertToBuffer(data.value));
            const value = buf.toString(FROM_STORAGE_ENCODING);
            return JSON.parse(value);
        } catch (ex) {
            console.log(`Could not decompress given data.`, ex.message);
            return null;
        }
    }
}

export const createGzipCompression = () => {
    return new GzipCompression();
};
