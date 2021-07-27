import zlib from "zlib";

export const gzip = (input: zlib.InputType, options?: zlib.ZlibOptions): Promise<Buffer> => {
    return new Promise(function(resolve, reject) {
        zlib.gzip(input, options, function(error, result) {
            if (!error) {
                resolve(result);
            } else {
                reject(error);
            }
        });
    });
};
export const ungzip = (input: zlib.InputType, options?: zlib.ZlibOptions): Promise<Buffer> => {
    return new Promise(function(resolve, reject) {
        zlib.gunzip(input, options, function(error, result) {
            if (!error) {
                resolve(result);
            } else {
                reject(error);
            }
        });
    });
};

const GZIP = "gzip";
const TO_STORAGE_ENCODING = "base64";
const FROM_STORAGE_ENCODING = "utf8";

const convertToBuffer = value => {
    if (typeof value === "string") {
        return Buffer.from(value, TO_STORAGE_ENCODING);
    }
    return value;
};

interface CompressedData {
    compression: string;
    value: string;
}
/**
 * Method to compress the elasticsearch data that is going to be stored into the DynamoDB table that is meant for elasticsearch.
 */
export const compress = async (data: Record<string, any>): Promise<CompressedData> => {
    /**
     * If already compressed, skip this.
     */
    if (data.compression) {
        return data as CompressedData;
    }

    const value = await gzip(JSON.stringify(data));

    return {
        compression: GZIP,
        value: value.toString(TO_STORAGE_ENCODING)
    };
};

export const decompress = async (
    data: CompressedData | Record<string, any>
): Promise<Record<string, any>> => {
    /**
     * Possibly it is decompressed already or it never was compressed?
     */
    if (!data || !data.compression) {
        return data;
    } else if (data.compression !== GZIP) {
        console.log(
            `Could not decompress given data since its compression is not "${GZIP}". It is "${data.compression}".`
        );
        return null;
    }
    const buf = await ungzip(convertToBuffer(data.value));

    try {
        const value = buf.toString(FROM_STORAGE_ENCODING);
        return JSON.parse(value);
    } catch (ex) {
        return null;
    }
};
