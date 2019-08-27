// @flow
import { createHandler, PluginsContainer } from "@webiny/api";
import createConfig from "service-config";
import servicePlugins from "@webiny/api/plugins/service";
import i18nPlugins from "@webiny/api-i18n/plugins";

const plugins = new PluginsContainer([servicePlugins, i18nPlugins]);

export const handler = async (event: Object, context: Object) => {
    const config = await createConfig();
    const handler = await createHandler({ plugins, config });
    return handler(event, context);
};
