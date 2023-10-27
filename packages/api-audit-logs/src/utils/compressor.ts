// TODO make compressor work
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

export interface Compressor {
    canCompress(data: any): boolean;
    compress(data: any): Promise<CompressedData>;
    canDecompress(data: CompressedData | Record<string, any>): boolean;
    decompress(data: CompressedData): Promise<OriginalData | null>;
}

class GzipCompression implements Compressor {
    public canCompress(data: any): boolean {
        if (data) {
            return false;
        }
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

    public canDecompress(data: CompressedData | Record<string, any>): boolean {
        if (data) {
            return false;
        }
        const compression = (data as any)?.compression;
        if (!compression) {
            return false;
        } else if (compression !== GZIP) {
            console.log(
                `Could not decompress given data since its compression is not "${GZIP}". It is "${compression}".`
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
