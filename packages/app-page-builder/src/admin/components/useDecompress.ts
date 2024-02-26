import pako from "pako";

interface CompressedContent {
    compression: "gzip";
    value: string;
}

const isCompressed = (
    value: DecompressedContent | CompressedContent
): value is CompressedContent => {
    return "compression" in value;
};

type DecompressedContent = Record<string, any>;

export const decompress = (content: CompressedContent) => {
    const value = pako.inflate(Buffer.from(content.value, "base64"), { to: "string" });
    return JSON.parse(value);
};

export const useDecompress = (value: DecompressedContent | CompressedContent) => {
    return isCompressed(value) ? decompress(value) : value;
};
