import { createGzipCompression } from "@webiny/api-elasticsearch";

export const getDecompressedData = async <R = any>(data: any): Promise<R> => {
    const compression = createGzipCompression();

    return (await compression.decompress(data)) as unknown as R;
};
