import { compress as gzip, decompress as ungzip } from "@webiny/utils/compression/gzip";
import { PageBlock } from "./types";

const GZIP = "gzip";
const TO_STORAGE_ENCODING = "base64";
const FROM_STORAGE_ENCODING = "utf8";

const convertToBuffer = (value: string | Buffer) => {
    if (typeof value === "string") {
        return Buffer.from(value, TO_STORAGE_ENCODING);
    }
    return value;
};

export const compress = async (data: any) => {
    const value = await gzip(JSON.stringify(data));

    return {
        compression: GZIP,
        value: value.toString(TO_STORAGE_ENCODING)
    };
};

export const decompress = async (pageBlock: PageBlock) => {
    try {
        const buf = await ungzip(convertToBuffer(pageBlock.content.value));
        const value = buf.toString(FROM_STORAGE_ENCODING);
        return {
            ...pageBlock,
            content: JSON.parse(value)
        };
    } catch (ex) {
        return { ...pageBlock, content: null };
    }
};
