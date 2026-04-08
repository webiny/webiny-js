import { PluginsContainer } from "@webiny/plugins";
import { Context } from "@webiny/api";
import { CompressionHandler } from "@webiny/utils/exports/api.js";

export const getContextWithCompressor = () => {
    return new Context({
        plugins: new PluginsContainer(),
        WEBINY_VERSION: "0.0.0"
    });
};

export const getCompressionHandler = () => {
    const context = getContextWithCompressor();

    const compressionHandler = context.container.resolve(CompressionHandler);
    if (!compressionHandler) {
        throw new Error("There is no CompressionHandler on context.");
    }
    return compressionHandler;
};
