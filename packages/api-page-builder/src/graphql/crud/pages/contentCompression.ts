import jsonpack from "jsonpack";

interface CompressedContent {
    compression: string;
    content: string;
}

export const extractContent = async (
    contentProp: CompressedContent | string | any
): Promise<Record<string, any>> => {
    if (!contentProp || !contentProp.compression) {
        return null;
    }

    try {
        return jsonpack.unpack(contentProp.content);
    } catch {
        return null;
    }
};

export const compressContent = async (
    content: Record<string, any> = null
): Promise<CompressedContent> => {
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
