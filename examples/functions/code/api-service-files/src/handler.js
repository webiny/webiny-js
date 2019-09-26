// @flow
import { createHandler, PluginsContainer } from "@webiny/api";
import createConfig from "service-config";

import securityPlugins from "@webiny/api-security/plugins/service";
import filesPlugins from "@webiny/api-files/plugins";

let apolloHandler;

export const handler = async (event: Object, context: Object) => {
    if (!apolloHandler) {
        const config = await createConfig();
        const plugins = new PluginsContainer([securityPlugins, filesPlugins(config)]);
        const { handler } = await createHandler({ plugins, config });
        apolloHandler = handler;
    }

    return apolloHandler(event, context);
};
