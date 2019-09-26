// @flow
import "source-map-support/register";
import { createHandler, PluginsContainer } from "@webiny/api";
import createConfig from "service-config";
import securityPlugins from "@webiny/api-security/plugins/service";
import i18nPlugins from "@webiny/api-i18n/plugins/service";
import formsPlugins from "@webiny/api-forms/plugins";

let apolloHandler;

export const handler = async (event: Object, context: Object) => {
    if (!apolloHandler) {
        const config = await createConfig();
        const plugins = new PluginsContainer([securityPlugins, i18nPlugins, formsPlugins(config)]);

        const { handler } = await createHandler({ plugins, config });
        apolloHandler = handler;
    }

    return apolloHandler(event, context);
};
