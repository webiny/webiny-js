// @flow
import { createHandler, PluginsContainer } from "@webiny/api";
import securityPlugins from "@webiny/api-security/plugins/service";
import headlessPlugins from "@webiny/api-cms/plugins";
import createConfig from "service-config";

let apolloHandler;

export const handler = async (event: Object, context: Object) => {
    if (!apolloHandler) {
        const config = await createConfig();
        const plugins = new PluginsContainer([securityPlugins, headlessPlugins(config)]);
        const { handler } = await createHandler({ plugins, config });
        apolloHandler = handler;
    }

    return apolloHandler(event, context);
};
