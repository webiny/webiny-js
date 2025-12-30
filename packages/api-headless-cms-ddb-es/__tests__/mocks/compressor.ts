import { createDefaultCompressor } from "@webiny/utils/compression";
import { PluginsContainer } from "@webiny/plugins";
import { Context } from "@webiny/api";

const compressor = createDefaultCompressor({
    plugins: new PluginsContainer()
});

compressor.disable("jsonpack");

export const compress = async (data: unknown): Promise<string> => {
    const result = await compressor.compress(data);
    if (!result || typeof result !== "object") {
        throw new Error("Failed to compress data.");
    }
    // @ts-expect-error
    return result.value as string;
};

export const decompress = async (data: string): Promise<unknown> => {
    return await compressor.decompress({
        compression: "gzip",
        value: data
    });
};

export const getContextWithCompressor = () => {
    return new Context({
        plugins: new PluginsContainer(),
        WBY_VERSION: "0.0.0"
    });
};
