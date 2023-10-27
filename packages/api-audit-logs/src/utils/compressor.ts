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

export interface OriginalData {
    [key: string]: any;
}

export interface Compressor {
    canCompress(data: any): boolean;
    compress(data: any): Promise<string>;
    canDecompress(data: string): boolean;
    decompress(data: string): Promise<OriginalData | null>;
}

class GzipCompression implements Compressor {
    public canCompress(data: any): boolean {
        let compression: string | undefined;
        try {
            const result = JSON.parse(data);
            if (!result?.compression) {
                return false;
            }
            compression = result.compression;
        } catch {
            return false;
        }
        /**
         * If already compressed, skip this.
         */
        if (compression) {
            if (compression !== "GZIP") {
                console.log(`Data is compressed with "${compression}". Cannot compress again.`);
            }
            return false;
        }
        return true;
    }
    public async compress(data: any) {
        try {
            const value = await gzip(JSON.stringify(data));

            return JSON.stringify({
                compression: GZIP,
                value: value.toString(TO_STORAGE_ENCODING)
            });
        } catch (ex) {
            console.log(`Could not compress given data.`, ex.message);
            return data;
        }
    }

    public canDecompress(data: string): boolean {
        let compression: string;
        try {
            const result = JSON.parse(data);
            if (!result?.compression) {
                return false;
            }
            compression = result.compression;
        } catch {
            return false;
        }
        if (compression !== GZIP) {
            console.log(
                `Could not decompress given data since its compression is not "${GZIP}". It is "${compression}".`
            );
            return false;
        }
        return true;
    }

    public async decompress(data: string): Promise<OriginalData | null> {
        let compressedValue: string;
        try {
            const result = JSON.parse(data);
            if (!result.value) {
                return null;
            }
            compressedValue = result.value;
        } catch {
            return null;
        }
        try {
            const buf = await ungzip(convertToBuffer(compressedValue));
            const value = buf.toString(FROM_STORAGE_ENCODING);
            return JSON.parse(value);
        } catch (ex) {
            console.log(`Could not decompress given data.`, ex.message);
            return null;
        }
    }
}

const createCompressor = (): Pick<Compressor, "compress" | "decompress"> => {
    const instance = new GzipCompression();

    return {
        compress: async (data: any) => {
            if (!instance.canCompress(data)) {
                return data;
            }
            return instance.compress(data);
        },
        decompress(data: any) {
            if (!instance.canDecompress(data)) {
                return data;
            }
            return instance.decompress(data);
        }
    };
};

const compressor = createCompressor();

export { compressor };
