import { createHandler, PluginsContainer } from "@webiny/api";
import servicePlugins from "@webiny/api/plugins/service";
import securityPlugins from "@webiny/api-security/plugins/service";
import createConfig from "./config";

const plugins = new PluginsContainer([servicePlugins, securityPlugins]);

let apolloHandler;

export const handler = async (event, context) => {
    if (!apolloHandler) {
        const config = await createConfig();
        const { handler } = await createHandler({ plugins, config });
        apolloHandler = handler;
    }

    return apolloHandler(event, context);
};
