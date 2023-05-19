import { compress as gzip } from "@webiny/utils/compression/gzip";

const GZIP = "gzip";
const TO_STORAGE_ENCODING = "base64";

export const getCompressedData = async (data: any) => {
    const value = await gzip(JSON.stringify(data));

    return {
        compression: GZIP,
        value: value.toString(TO_STORAGE_ENCODING)
    };
};
