import jsonpack from "jsonpack";

export const extractContent = (contentProp: Record<string, any>): Record<string, any> => {
    if (!contentProp || !contentProp.compression) {
        return null;
    }

    try {
        return jsonpack.unpack(contentProp.content);
    } catch {
        return null;
    }
};

export const compressContent = (content: Record<string, any> = null): Record<string, any> => {
    let compressed = null;
    if (content) {
        try {
            compressed = jsonpack.pack(content);
        } catch {}
    }

    return {
        compression: "jsonpack",
        content: compressed
    };
};
