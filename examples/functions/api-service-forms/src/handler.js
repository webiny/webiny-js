// @flow
import "source-map-support/register";
import { createHandler, PluginsContainer } from "@webiny/api";
import createConfig from "service-config";
import servicePlugins from "@webiny/api/plugins/service";
import securityPlugins from "@webiny/api-security/plugins/service";
import formsPlugins from "@webiny/api-forms/plugins";
import i18nPlugins from "@webiny/api-i18n/plugins/service";

const plugins = new PluginsContainer([servicePlugins, securityPlugins, i18nPlugins, formsPlugins]);

export const handler = async (event: Object, context: Object) => {
    const config = await createConfig();
    const handler = await createHandler({ plugins, config });
    return handler(event, context);
};
