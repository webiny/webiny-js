import { PluginsContainer } from "@webiny/plugins";
import { createGzipCompression } from "@webiny/api-elasticsearch";

export const createPlugins = () => {
    return new PluginsContainer([createGzipCompression()]);
};
