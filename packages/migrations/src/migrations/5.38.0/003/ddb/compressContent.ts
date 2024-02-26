import { compress } from "@webiny/utils/compression/gzip";

export const compressContent = async (data: Record<string, any>) => {
    const compressedValue = await compress(JSON.stringify(data));

    return {
        compression: "gzip",
        value: compressedValue.toString("base64")
    };
};
