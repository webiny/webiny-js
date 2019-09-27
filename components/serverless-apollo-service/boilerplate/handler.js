import { createHandler, PluginsContainer } from "@webiny/api";
import securityPlugins from "@webiny/api-security/plugins/service";
import createConfig from "./config";

let apolloHandler;

export const handler = async (event, context) => {
    if (!apolloHandler) {
        const config = await createConfig();
        const plugins = new PluginsContainer([securityPlugins]);
        const { handler } = await createHandler({ plugins, config });
        apolloHandler = handler;
    }

    return apolloHandler(event, context);
};
