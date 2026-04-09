import jsonpack from "jsonpack";

export const compress = async (value: any) => {
    return jsonpack.pack(value, {
        verbose: false
    });
};

export const decompress = async (value: string) => {
    return jsonpack.unpack(value);
};
