import type { Context } from "@webiny/handler/types.js";
import { createRequestIdPlugin } from "./requestId.js";

export const registerDefaultPlugins = (context: Context): void => {
    context.plugins.register([
        createRequestIdPlugin()
    ]);
};
