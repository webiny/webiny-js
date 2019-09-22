// @flow
import { createHandler, PluginsContainer } from "@webiny/api";
import servicePlugins from "@webiny/api/plugins/service";
import securityPlugins from "@webiny/api-security/plugins/service";
import headlessPlugins from "@webiny/api-cms/plugins";
import createConfig from "service-config";

const plugins = new PluginsContainer([servicePlugins, securityPlugins, headlessPlugins]);

let apolloHandler;

export const handler = async (event: Object, context: Object) => {
    if (!apolloHandler) {
        const config = await createConfig();
        const { handler } = await createHandler({ plugins, config });
        apolloHandler = handler;
    }

    return apolloHandler(event, context);
};
