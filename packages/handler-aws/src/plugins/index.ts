import { createHandlerClientPlugin } from "./handlerClient";
import { Context } from "@webiny/handler/types";

export const registerDefaultPlugins = (context: Context): void => {
    context.plugins.register([createHandlerClientPlugin()]);
};
