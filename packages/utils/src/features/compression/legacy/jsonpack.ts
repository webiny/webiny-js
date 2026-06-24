import { pack, unpack } from "jsonpack";

export const compress = async (value: any) => {
    return pack(value, {
        verbose: false
    });
};

export const decompress = async (value: string) => {
    return unpack(value);
};
