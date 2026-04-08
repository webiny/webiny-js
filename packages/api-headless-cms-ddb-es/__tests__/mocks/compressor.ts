import { PluginsContainer } from "@webiny/plugins";
import { Context } from "@webiny/api";

export const getContextWithCompressor = () => {
    return new Context({
        plugins: new PluginsContainer(),
        WEBINY_VERSION: "0.0.0"
    });
};
