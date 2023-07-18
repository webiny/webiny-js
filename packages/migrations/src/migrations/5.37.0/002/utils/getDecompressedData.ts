import { decompress as ungzip } from "@webiny/utils/compression/gzip";

const GZIP = "gzip";
const TO_STORAGE_ENCODING = "base64";
const FROM_STORAGE_ENCODING = "utf8";

const convertToBuffer = (value: string | Buffer) => {
    if (typeof value === "string") {
        return Buffer.from(value, TO_STORAGE_ENCODING);
    }
    return value;
};

export const getDecompressedData = async <T>(data: any): Promise<T | null> => {
    if (data?.compression !== GZIP) {
        return null;
    }
    try {
        const buf = await ungzip(convertToBuffer(data.value));
        const value = buf.toString(FROM_STORAGE_ENCODING);
        return JSON.parse(value);
    } catch (ex) {
        return null;
    }
};
